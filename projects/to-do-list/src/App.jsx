import { useState } from 'react'
import List from '../components/list.jsx'

function App() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')

  const addTodo = () => {
    if (input.trim() === '') return
    setTodos([...todos, input])
    setInput('')
  }

  const removeTodo = (index) => {
    setTodos(todos.filter((_, i) => i !== index))
  }

  return (
    <div>
      <h1>To-Do List</h1>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add a new task..."
      />
      <button onClick={addTodo}>Add</button>
      <List todos={todos} removeTodo={removeTodo} />
    </div>
  )
}

export default App
