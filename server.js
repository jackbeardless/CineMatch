const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
require('dotenv').config();

app.use(express.static('public'));
app.use(express.json());

app.post('/api/recommendations', async (req, res) => {
    try {
        console.log('Starting request with preferences:', req.body.preferences);
        
        const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
                'X-Title': 'Movie Recommender',
                'OpenRouter-Beta': 'true'
            },
            body: JSON.stringify({
                model: 'mistralai/mistral-7b-instruct:free',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a movie recommendation assistant. Respond only with a JSON array.'
                    },
                    {
                        role: 'user',
                        content: req.body.preferences || 'Recommend me some movies'
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.text();
            console.error('API Error Response:', errorData);
            throw new Error(`API responded with status ${apiResponse.status}: ${errorData}`);
        }

        const data = await apiResponse.json();
        const movies = JSON.parse(data.choices[0].message.content);

        // Fetch movie details from TMDB for each movie
        const moviesWithPosters = await Promise.all(movies.map(async (movie) => {
            try {
                // Search for the movie
                const searchResponse = await fetch(
                    `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(movie.title)}&year=${movie.year}`
                );
                const searchData = await searchResponse.json();
                
                if (searchData.results && searchData.results[0]) {
                    const movieDetails = searchData.results[0];
                    return {
                        ...movie,
                        posterPath: movieDetails.poster_path,
                        tmdbId: movieDetails.id,
                        overview: movieDetails.overview
                    };
                }
                return movie;
            } catch (error) {
                console.error(`Error fetching details for ${movie.title}:`, error);
                return movie;
            }
        }));

        res.json({ 
            recommendations: JSON.stringify(moviesWithPosters),
            raw: JSON.stringify(moviesWithPosters)
        });

    } catch (error) {
        console.error('Error in /api/recommendations:', error);
        res.status(500).json({ 
            error: 'Failed to get recommendations',
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 