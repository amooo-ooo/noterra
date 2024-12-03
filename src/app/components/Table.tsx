"use client";

import React from "react";
import { ReactSortable, type Sortable } from "react-sortablejs";

// TODO:
export function Table(){
	const table = React.useRef([[
		"hello",
		"hi"
	], [
		"a",
		"b"
	]]);
	const [colList, setColList] = React.useState([{id: 0}, {id: 1}]);
	const [rowList, setRowList] = React.useState<{
		id: number,
		ref?: ReactSortable<{id: number}> | null,
	}[]>([{id: 0}, {id: 1}]);

	// const [state, setState] = React.useState<{
	// 	id: number,
	// 	children: {
	// 		id: number,
	// 		children: React.ReactNode
	// 	}[]
	// }[]>([{
	// 	id: 0,
	// 	children: [
	// 		{id: 0, children: <>hello</>},
	// 		{id: 1, children: <>hi</>}]
	// }, {
	// 	id: 1,
	// 	children: [
	// 		{id: 0, children: <>a</>},
	// 		{id: 1, children: <>b</>}]
	// }])
	return <ReactSortable
		animation={250}
		list={rowList}
		setList={setRowList}
		style={{
			display: 'grid',
			gridTemplateColumns: `min-content repeat(${colList.length}, 1fr)`,
			// gridTemplateRows: 'auto',
			gridAutoFlow: 'column',
			// gridTemplateColumns: 'auto'
		}}
		dragClass="drag-handle"
	>
		{...rowList.map(row => {
			return <span key={row.id} style={{
				display: 'grid',
				gridColumn: '1 / -1',
				gridTemplateColumns: 'subgrid',
			}}>
				<span className="drag-handle">e</span>
				<ReactSortable
					animation={250}
					
					list={colList}
					setList={setColList}
					onChange={() => {
						const sortable = (row.ref as unknown as { get sortable(): Sortable }).sortable;
						const newListish = sortable.toArray();
						
						for(const row2 of rowList) {
							if(row2 === row) continue;
							const sortable2 = (row2.ref as unknown as { get sortable(): Sortable }).sortable;
							sortable2.sort(newListish, true);
						}
					}}
					ref={el => { row.ref = el; }}

					style={{
						display: 'contents',
					}}
				>
					{...colList.map(cell => {
						return <span
							key={cell.id}
							style={{
								padding: 10,
							}}
						>{table.current[row.id][cell.id]}</span>
					})}
				</ReactSortable>
			</span> 
		})}
	</ReactSortable>
}
