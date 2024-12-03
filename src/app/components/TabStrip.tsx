"use client";

import React from "react";
import { ReactSortable } from "react-sortablejs";
import { type EditorData, Editor } from "./editor";

function tabReducer<T>(state: T[], action: {
	type: 'remove',
	predicate: (value: T) => boolean,
} | {
	type: 'append',
	initialValue: T,
} | {
	type: 'rename',
	index: number,
	value: T,
} | {
	type: 'reorder',
	value: T[]
}) {
	switch(action.type) {
		case 'append':
			return state.concat(action.initialValue);
		case 'remove':
			return state.filter(x => !action.predicate(x));
		case 'rename': {
			const newState = [...state];
			newState[action.index] = action.value;
			return newState;
		}
		case 'reorder':
			return action.value;
	}
}

type Tab = {
	id: number,
	state: EditorData,
}

export function TabStrip({
	tabs,
	modifyTabs,
	currentTab,
	setCurrentTab,
	idGen,
}: {
	tabs: Tab[],
	modifyTabs: React.Dispatch<React.ReducerAction<typeof tabReducer<Tab>>>,
	currentTab: Tab['id'],
	setCurrentTab: React.Dispatch<Tab['id']>,
	idGen: () => Tab['id'],
}) {
	return <div style={{
		display: 'flex',
	}}>
		{/* TODO: move styles (sards has styles for this already?) */}
		{/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
		<style dangerouslySetInnerHTML={{__html: `
			@property --bg {
				syntax: "<color>";
				inherits: false;
				default: transparent;
			}

			.tab > .tab-border {
				--border-color: #303030;
				margin: 1px 1px 1px 0px;
				box-shadow: var(--border-color) 0px 1px, var(--border-color) -1px 1px;
			}

			.tab {
				--radius: 5px;
				--hover-color: #101010;
				--active-color: #202020;
				--transition-props: 200ms ease;
				background: transparent;
				transition: background-color var(--transition-props);
			}

			.tab:is(:hover, :focus-visible) {
				background-color: var(--hover-color);
			}
			.tab:active {
				background-color: var(--active-color);
			}

			.tab:first-child > .tab-border {
				box-shadow: var(--border-color) 0 1px;
			}
			
			.tab:last-child > .tab-border {
				margin-right: 1px;
			}
			.tab {
				border-top-left-radius: var(--radius);
				border-top-right-radius: var(--radius);
			}
			.tab.active-tab > .tab-border {
				box-shadow: var(--border-color) 1px -1px, var(--border-color) -1px -1px;
				border-top-left-radius: var(--radius);
				border-top-right-radius: var(--radius);
				clip-path: inset(-9999px -9999px var(--radius) -9999px);
			}

			.tab.active-tab + .tab {
				border-bottom-left-radius: var(--radius);
			}
			.tab.active-tab + .tab > .tab-border {
				border-bottom-left-radius: var(--radius);
				clip-path: inset(var(--radius) -2px -1px -1px);
				transition: --bg var(--transition-props);
				box-shadow: var(--border-color) 0px 1px, var(--border-color) -1px 1px, var(--bg, transparent) -9999px 9999px 0 9999px;
			}
			.tab.active-tab:is(:hover, :focus-visible) + .tab > .tab-border {
				--bg: var(--hover-color);
			}
			.tab.active-tab:active + .tab > .tab-border {
				--bg: var(--active-color);
			}
			.tab:has(+ .tab.active-tab) {
				border-bottom-right-radius: var(--radius);
			}
			.tab:has(+ .tab.active-tab) > .tab-border {
				box-shadow: var(--border-color) 0 1px, var(--border-color) 1px 1px, var(--bg, transparent) 9999px 9999px 0 9999px;
				border-bottom-right-radius: var(--radius);
				clip-path: inset(var(--radius) -2px -1px -1px);
				transition: --bg var(--transition-props);
			}
			.tab:has(+ .tab.active-tab:is(:hover, :focus-visible)) > .tab-border {
				--bg: var(--hover-color);
			}
			.tab:has(+ .tab.active-tab:active) > .tab-border {
				--bg: var(--active-color);
			}
			.tab:has(+ .tab + .tab.active-tab) > .tab-border {
				box-shadow: var(--border-color) 1px 1px, var(--border-color) -1px 1px;
			}
			.tab:first-child:has(+ .tab + .tab.active-tab) > .tab-border {
				box-shadow: var(--border-color) 1px 1px, var(--border-color) 0px 1px;
			}
		`}}/>
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
				className={`tab${tab.id === currentTab ? ' active-tab' : ''}`}
			>
				<div
					style={{
						display: 'flex',
						padding: 5,
					}}
					className="tab-border"
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

export function TabManager() {
	const [tabs, modifyTabs] = React.useReducer(tabReducer<Tab>, []);
	const [currentTab, setCurrentTab] = React.useState(0);
	const [nextId, setNextId] = React.useState(0);
	return <>
		<TabStrip {...{tabs, modifyTabs, currentTab, setCurrentTab}} idGen={() => {
			const id = nextId;
			setNextId(id + 1);
			return id;
		}} />
		{...tabs.map(tab => {
			return <Editor key={tab.id} data={tab.state} skipRender={tab.id !== currentTab} />
		})}
	</>
}
