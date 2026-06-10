import React from 'react'

export default function List({ todos, removeTodo }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>
          {todo}
          <button onClick={() => removeTodo(index)}>❌</button>
        </li>
      ))}
    </ul>
  )
}
