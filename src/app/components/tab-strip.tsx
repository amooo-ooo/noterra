"use client";

import type React from "react";
import { ReactSortable } from "react-sortablejs";
import type { Tab, TabListDispatcher } from "./tab-manager";
import styles from '../styles/tab-strip.module.css';

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
	const close = (tab: Tab) => {
		if(tab.id === currentTab) {
			let idx = tabs.findIndex(x => x.id === tab.id) - 1;
			if(idx < 0) idx += 2;
			setCurrentTab(tabs[idx].id);
		}
		modifyTabs({
			type: 'remove',
			predicate: x => x.id === tab.id
		});
	}

	return <div className={styles.tabstrip}>
		<ReactSortable
			list={tabs}
			setList={list => modifyTabs({ type: 'reorder', value: list })}
			animation={250}
			className={styles.container}
		>
			{...tabs.map(tab => <button
				type='button'
				key={tab.id}
				onClick={() => setCurrentTab(tab.id)}
				className={`${styles.tab} ${tab.id === currentTab ? styles['active-tab'] : ''}`}
			>
				<div className={styles['tab-border']}>
					<span>{tab.state.name}</span>
					<span
						// biome-ignore lint/a11y/useSemanticElements: nesting
						role='button'
						tabIndex={0}
						style={{
							flexGrow: 0,
							flexShrink: 0,
						}}
						onKeyDown={e => {if(e.key === ' ') e.preventDefault(); }}
						onKeyUp={e => { if(e.key === 'Enter' || e.key === ' '){
							e.stopPropagation();
							close(tab);
						}}}
						onClick={e => {
							e.stopPropagation();
							close(tab);
						}}
					>x</span>
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
