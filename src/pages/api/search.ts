// https://github.com/Pagefind/pagefind/issues/519
// https://github.com/tgoHQ/api/blob/main/src/endpoints/pagefind.ts

export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async (ctx) => {
	const query = ctx.url.searchParams.get('q');

	if (!query) {
		return new Response("Query parameter 'q' is required", { status: 400 });
	}

	// load and initialize pagefind
	const pagefind = await loadPagefind();
	pagefind.options({
		basePath: new URL('/pagefind', import.meta.env.SITE),
	});

	// search and return results
	const results = await search(query, pagefind);

	return new Response(JSON.stringify(results), {
		headers: {
			'Content-Type': 'application/json',
		},
		status: 200,
	});
};

async function search(query: string, pagefind: any) {
	const results = await pagefind.search(query);

	const processedResults = await Promise.all(
		results.results.map(async (result: any) => {
			return await result.data();
		}),
	);

	return processedResults;
}

async function loadPagefind() {
	// fetch the pagefind code and build a module URL
	const url = new URL('/pagefind/pagefind.js', import.meta.env.SITE);
	const response = await fetch(url);

	let string = '';
	new Uint8Array(await response.arrayBuffer()).forEach((byte) => {
		string += String.fromCharCode(byte);
	});
	string = btoa(string);

	const moduleUrl = `data:application/javascript;base64,${string}`;

	// import and return the pagefind module
	return await import(moduleUrl);
}
