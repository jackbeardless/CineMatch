// Auto-resize textarea as user types
const textarea = document.getElementById('userPreferences');
textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});

// Handle enter key
textarea.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('getRecommendations').click();
    }
});

document.getElementById('getRecommendations').addEventListener('click', async () => {
    const userPreferences = textarea.value;
    const loadingElement = document.getElementById('loading');
    const recommendationsElement = document.getElementById('recommendations');
    
    if (!userPreferences.trim()) {
        alert('Please enter your preferences first!');
        return;
    }

    // Reset textarea height
    textarea.style.height = 'auto';
    textarea.value = '';

    // Show loading
    loadingElement.classList.remove('hidden');
    recommendationsElement.innerHTML = '';
    recommendationsElement.classList.remove('visible');

    try {
        const response = await fetch('/api/recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ preferences: userPreferences })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get recommendations');
        }

        const movies = typeof data.raw === 'string' ? JSON.parse(data.raw) : data.raw;

        const movieCards = movies.map(movie => `
            <div class="movie-card">
                <div class="movie-poster">
                    ${movie.posterPath 
                        ? `<img src="https://image.tmdb.org/t/p/w500${movie.posterPath}" alt="${movie.title}">`
                        : `<img src="https://placehold.co/300x450/e2e8f0/1e293b?text=${encodeURIComponent(movie.title)}" alt="${movie.title}">`
                    }
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <p class="movie-year">${movie.year}</p>
                    ${movie.overview ? `<p class="movie-overview">${movie.overview.slice(0, 100)}...</p>` : ''}
                    ${movie.tmdbId ? `
                        <a href="https://www.themoviedb.org/movie/${movie.tmdbId}" 
                           target="_blank" 
                           class="tmdb-link">
                            View on TMDB
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');

        recommendationsElement.innerHTML = movieCards;
        
        // Add small delay before showing recommendations
        setTimeout(() => {
            recommendationsElement.classList.add('visible');
        }, 100);

    } catch (error) {
        console.error('Error:', error);
        recommendationsElement.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    } finally {
        // Hide loading with a small delay
        setTimeout(() => {
            loadingElement.classList.add('hidden');
        }, 500);
    }
});

// Add this at the start of your script.js
const phrases = [
    "Tell us what you like!",
    "Action movies?",
    "Adam sandler movies?",
    "Rom-coms?",
    "Sci-fi thrillers?",
    "Classic films?",
    "Horror movies?",
    "What's your mood today?"
];

class TypingAnimation {
    constructor(element, phrases, options = {}) {
        this.element = element;
        this.phrases = phrases;
        this.currentPhrase = 0;
        this.currentChar = 0;
        this.isDeleting = false;
        this.typeSpeed = options.typeSpeed || 100;
        this.deleteSpeed = options.deleteSpeed || 50;
        this.delayBeforeDelete = options.delayBeforeDelete || 2000;
        this.delayBeforeType = options.delayBeforeType || 500;
    }

    type() {
        const currentPhrase = this.phrases[this.currentPhrase];
        
        if (this.isDeleting) {
            // Deleting text
            this.currentChar--;
            this.element.textContent = currentPhrase.substring(0, this.currentChar);
            
            if (this.currentChar === 0) {
                this.isDeleting = false;
                this.currentPhrase = (this.currentPhrase + 1) % this.phrases.length;
                setTimeout(() => this.type(), this.delayBeforeType);
                return;
            }
            
            setTimeout(() => this.type(), this.deleteSpeed);
        } else {
            // Typing text
            this.currentChar++;
            this.element.textContent = currentPhrase.substring(0, this.currentChar);
            
            if (this.currentChar === currentPhrase.length) {
                this.isDeleting = true;
                setTimeout(() => this.type(), this.delayBeforeDelete);
                return;
            }
            
            setTimeout(() => this.type(), this.typeSpeed);
        }
    }

    start() {
        this.type();
    }
}

// Start the typing animation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const typingElement = document.getElementById('typing-text');
    const animation = new TypingAnimation(typingElement, phrases, {
        typeSpeed: 100,        // Speed of typing
        deleteSpeed: 50,       // Speed of deleting
        delayBeforeDelete: 2000, // How long to wait before deleting
        delayBeforeType: 500   // How long to wait before typing next phrase
    });
    animation.start();
}); 
//Hello