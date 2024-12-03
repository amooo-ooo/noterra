"use client";

import type React from "react";
import { ReactSortable } from "react-sortablejs";
import type { Tab, TabListDispatcher } from "./tab-manager";
import styles from './tab-strip.module.css';

export function TabStrip({
	tabs,
	modifyTabs,
	currentTab,
	setCurrentTab,
	idGen,
}: {
	tabs: Tab[],
	modifyTabs: TabListDispatcher,
	currentTab: Tab['id'],
	setCurrentTab: React.Dispatch<Tab['id']>,
	idGen: () => Tab['id'],
}) {
	return <div style={{
		display: 'flex',
	}}>
		<ReactSortable
			list={tabs}
			setList={list => modifyTabs({ type: 'reorder', value: list })}
			animation={250}
			style={{
				display: 'contents',
			}}
		>
			{...tabs.map(tab => <button
				type='button'
				key={tab.id}
				onClick={() => setCurrentTab(tab.id)}
				style={{
					flexGrow: 1,
					flexShrink: 1,
					flexBasis: 0,
					minWidth: 0,
					maxWidth: '10ch',
					borderWidth: '0',
					outline: 'none',
				}}
				className={`${styles.tab} ${tab.id === currentTab ? styles.active_tab : ''}`}
			>
				<div
					style={{
						display: 'flex',
						padding: 5,
					}}
					className={styles.tab_border}
				>
					<span style={{
						userSelect: 'none',
						flexGrow: 1,
						flexShrink: 1,
						minWidth: 0,
					}}>{tab.state.name}</span>
					<button
						type='button'
						style={{
							flexGrow: 0,
							flexShrink: 0,
						}}
						onClick={e => {
							e.stopPropagation();
							if(tab.id === currentTab) {
								let idx = tabs.findIndex(x => x.id === tab.id) - 1;
								if(idx < 0) idx += 2;
								setCurrentTab(tabs[idx].id);
							}
							modifyTabs({
								type: 'remove',
								predicate: x => x.id === tab.id
							});
						}}
					>x</button>
				</div>
			</button>)}
		</ReactSortable>
		<button
			type="button"
			onClick={() => {
				// new tab created here we might wanna do stuff
				const id = idGen();
				modifyTabs({
					type: 'append', initialValue: {
						id,
						state: {
							id: `${id}`, // TODO: get a better id
							name: 'Untitled'
						}
					}
				});
			}}
		>+</button>
	</div>
}
