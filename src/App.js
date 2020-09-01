import React, { useState, useEffect } from 'react';
import './App.css';
import Amplify, { DataStore, Predicates } from 'aws-amplify';
import { Todo } from './models';
import awsconfig from './aws-exports';

// Amplify.Logger.LOG_LEVEL = 'DEBUG';
Amplify.configure(awsconfig);

const MAXITEMS = 1000;

function App() {
	const [todos, setTodos] = useState([]);
	const [inputText, setInputText] = useState(250);
	const [intervalId, setIntervalId] = useState(null);

	useEffect(() => {
		getTodos();
	}, []);

	useEffect(() => {
		const sub = DataStore.observe(Todo).subscribe(({ element, opType }) => {
			const opTypeUpdaters = {
				DELETE: (todos) => todos.filter((todo) => todo.id !== element.id),
				INSERT: (todos) => {
					todos.push(element);
				},
				UPDATE: (todos) =>
					todos.map((todo) => (todo.id === element.id ? element : todo)),
			};

			setTodos(opTypeUpdaters[opType]);
		});

		return () => sub.unsubscribe();
	}, []);

	async function getTodos() {
		const items = await DataStore.query(Todo);
		setTodos(items);
	}

	function onAddTodo() {
		if (todos.length >= MAXITEMS) {
			onStopAdding();
		}

		const newTodo = new Todo({
			name: `todo-${Date.now()}`,
		});

		DataStore.save(newTodo);
	}

	function onDeleteAll() {
		DataStore.delete(Todo, Predicates.ALL);
	}

	function onStartAdding() {
		const id = setInterval(onAddTodo, inputText);
		setIntervalId(id);
	}

	function onStopAdding() {
		clearInterval(intervalId);
	}

	function onInputChange({ target: { value } }) {
		setInputText(value);
	}

	return (
		<div className="App">
			<p>
				Will automatically stop after {MAXITEMS} items (if not stopped sooner)
			</p>
			<div style={styles.buttonGroup}>
				<input
					type="number"
					min="50"
					max="5000"
					value={inputText}
					onChange={onInputChange}
				/>
				ms
			</div>
			<div style={styles.buttonGroup}>
				<button onClick={onStartAdding}>Start Adding</button>
				<button onClick={onStopAdding}>Stop Adding</button>
			</div>
			<div style={styles.buttonGroup}>
				<button style={styles.deleteBtn} onClick={onDeleteAll}>
					Delete All
				</button>
			</div>

			<p>{todos.length} todos in state</p>
			<pre>{JSON.stringify(todos, null, 2)}</pre>
		</div>
	);
}

const styles = {
	buttonGroup: { margin: '10px' },
	deleteBtn: { backgroundColor: 'red' },
};

export default App;
