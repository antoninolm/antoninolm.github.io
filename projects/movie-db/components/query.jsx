import React, { useState, useEffect } from 'react'

export default function App() {
  const [movies, setMovies] = useState([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('batman')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const API_KEY = '803fbadf'

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `https://www.omdbapi.com/?apikey=${API_KEY}&s=${query}`
        )
        const data = await response.json()

        if (data.Response === 'True') {
          setMovies(data.Search)
        } else {
          setError(data.Error)
          setMovies([])
        }
      } catch (err) {
        setError('Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [query])

  const handleSearch = () => {
    if (search.trim() !== '') setQuery(search)
  }

  return (
    <div>
      <h1>🎬 Movie Search</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search a movie..."
      />
      <button onClick={handleSearch}>Search</button>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      <ul>
        {movies.map((movie) => (
          <li key={movie.imdbID}>
            <img src={movie.Poster} alt={movie.Title} width="50" />
            {movie.Title} — {movie.Year}
          </li>
        ))}
      </ul>
    </div>
  )
}
