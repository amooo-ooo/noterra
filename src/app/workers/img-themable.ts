class ShaderCompileError extends Error { }

function raise(message: string): never {
	throw new Error(message);
}

type UniformCallableType<T extends unknown[]> = ((location: WebGLUniformLocation, ...value: T) => void);
type UniformTypes = {
	[K in Extract<keyof WebGL2RenderingContext, `uniform${string}`>]: WebGL2RenderingContext[K] extends UniformCallableType<infer A> ? A : never;
};

type Uniform<K extends keyof UniformTypes> = K extends string ? UniformTypes[K] extends object ? {
	type: K,
	value: UniformTypes[K];
} : never : never;

type ReadyShader = Shader & {
	vertexShader: WebGLShader,
	fragmentShader: WebGLShader,
	program: WebGLProgram,
};
class Shader {
	ctx: WebGL2RenderingContext;
	vertexSource = `\
#version 300 es
in vec2 aVertexPosition;
out vec2 vTexPos;

void main(void) {
	gl_Position = vec4(aVertexPosition, 0.0, 1.0);
	vTexPos = aVertexPosition * 0.5 + vec2(0.5);
}
`;
	fragmentSource = `\
#version 300 es
precision highp float;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uTexSize;
uniform float uTime;
in vec2 vTexPos;
out vec4 outColor;

void main() {
    vec4 texColor = texture(uTexture, vTexPos);
    outColor = texColor;
}
`;
	vertexShader?: WebGLShader;
	fragmentShader?: WebGLShader;
	program?: WebGLProgram;
	uniformLocations: { [key: string]: WebGLUniformLocation; } = {};
	constructor (ctx: WebGL2RenderingContext, vertex?: string, fragment?: string) {
		this.ctx = ctx;
		this.vertexSource = vertex ?? this.vertexSource;
		this.fragmentSource = fragment ?? this.fragmentSource;
	}
	setSource(type: 'vertex' | 'fragment', source: string) {
		this[({
			vertex: 'vertexSource',
			fragment: 'fragmentSource',
		} as const)[type]] = source;
	}
	getSource(type: 'vertex' | 'fragment') {
		return {
			vertex: this.vertexSource,
			fragment: this.fragmentSource,
		}[type];
	}
	compile(type: 'vertex' | 'fragment') {
		return this[({
			vertex: 'compileVertex',
			fragment: 'compileFragment',
		} as const)[type]]();
	}
	compileVertex(): asserts this is this & { vertexShader: WebGLShader; } {
		if (this.vertexShader) this.ctx.deleteShader(this.vertexShader);
		this.vertexShader = this.ctx.createShader(this.ctx.VERTEX_SHADER) ?? undefined;
		if (!this.vertexShader) // TODO: handle
			throw new Error("Failed to instanciate vertex shader");
		this.ctx.shaderSource(this.vertexShader, this.vertexSource);
		this.ctx.compileShader(this.vertexShader);
		if (!this.ctx.getShaderParameter(this.vertexShader, this.ctx.COMPILE_STATUS)) {
			throw new ShaderCompileError(this.ctx.getShaderInfoLog(this.vertexShader) ?? '');
		}
	}
	prepareVertex(): asserts this is this & { vertexShader: WebGLShader; } {
		if (!this.vertexShader) this.compileVertex();
	}
	compileFragment(): asserts this is this & { fragmentShader: WebGLShader; } {
		if (this.fragmentShader) this.ctx.deleteShader(this.fragmentShader);
		this.fragmentShader = this.ctx.createShader(this.ctx.FRAGMENT_SHADER) ?? undefined;
		if (!this.fragmentShader) // TODO: handle
			throw new Error("Failed to instanciate fragment shader");
		this.ctx.shaderSource(this.fragmentShader, this.fragmentSource);
		this.ctx.compileShader(this.fragmentShader);
		if (!this.ctx.getShaderParameter(this.fragmentShader, this.ctx.COMPILE_STATUS)) {
			throw new ShaderCompileError(this.ctx.getShaderInfoLog(this.fragmentShader) ?? '');
		}
	}
	prepareFragment(): asserts this is this & { fragmentShader: WebGLShader; } {
		if (!this.fragmentShader) this.compileFragment();
	}

	link(attribLocations: { [key: string]: number; }): asserts this is ReadyShader {
		if (this.program) this.ctx.deleteProgram(this.program);
		const program = this.ctx.createProgram();
		this.prepareVertex();
		this.prepareFragment();
		this.ctx.attachShader(program, this.vertexShader);
		this.ctx.attachShader(program, this.fragmentShader);
		for (const [k, v] of Object.entries(attribLocations)) {
			this.ctx.bindAttribLocation(program, v, k);
		}
		this.ctx.linkProgram(program);

		if (!this.ctx.getProgramParameter(program, this.ctx.LINK_STATUS)) {
			throw new ShaderCompileError(`Unable to initialize the shader program: ${this.ctx.getProgramInfoLog(program)}`);
		}

		this.ctx.useProgram(program);
		this.program = program;
		const uniformNames = [...new Set([...`${this.vertexSource}\n${this.fragmentSource}`.matchAll(/^\s*uniform\s+\w+\s*(\w+);/gm)].map(match => match[1]))];
		this.uniformLocations = {};
		for (const uniform of uniformNames) {
			const location = this.ctx.getUniformLocation(program, uniform);
			if (location) {
				this.uniformLocations[uniform] = location;
			} else {
				console.warn(`Failed to find index of '${uniform}'`);
			}
		}
	}
	prepare(attribLocations: { [key: string]: number; }): asserts this is ReadyShader {
		if (!this.program) {
			this.link(attribLocations);
		}
	}
	use(uniformMap: { [key: string]: Uniform<keyof UniformTypes>; }) {
		if (!this.program) throw new Error("program not ready to use");
		this.ctx.useProgram(this.program);
		for (const [k, v] of Object.entries(this.uniformLocations)) {
			const uniformValue = uniformMap[k];
			if (!uniformValue) {
				console.error(`No value was found for uniform ${k} at ${v} (values were: `, uniformMap);
				throw new Error();
			}
			(this.ctx[uniformValue.type] as UniformCallableType<unknown[]>)(v, ...uniformValue.value);
		}
	}
}

let _canvas: OffscreenCanvas | null = null;
let _canvas2: OffscreenCanvas | null = null;
let _ctx: WebGL2RenderingContext | null = null;
let _ctx2: OffscreenCanvasRenderingContext2D | null = null;
let _isThemeShader: Shader | null = null;
let _translucentShader: Shader | null = null;

export async function themable(imgSrc: Blob) {
	const img = await self.createImageBitmap(imgSrc, { imageOrientation: "flipY" });
	const { width, height } = img;
	// biome-ignore lint/suspicious/noAssignInExpressions: stfu
	const canvas = _canvas ??= new OffscreenCanvas(1, 1);
	canvas.width = width;
	canvas.height = height;
	// biome-ignore lint/suspicious/noAssignInExpressions: i mean it
	const ctx = _ctx ??= (() => {
		const ctx = canvas.getContext("webgl2", {
			alpha: true,
		}) ?? raise("no webgl ctx");
		ctx.enableVertexAttribArray(0);
		ctx.clearColor(0, 0, 0, 0);
		ctx.disable(ctx.DEPTH_TEST);

		const vertexPositions = ctx.createBuffer();
		ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexPositions);
		ctx.bufferData(
			ctx.ARRAY_BUFFER,
			new Float32Array([-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0]),
			ctx.STATIC_DRAW,
		);
		ctx.vertexAttribPointer(
			0,
			2,
			ctx.FLOAT,
			false,
			0,
			0,
		);
		const vertices = ctx.createBuffer();
		ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, vertices);
		ctx.bufferData(
			ctx.ELEMENT_ARRAY_BUFFER,
			new Uint8Array([0, 1, 2, 0, 2, 3]),
			ctx.STATIC_DRAW,
		);
		const tex = ctx.createTexture();
		ctx.activeTexture(ctx.TEXTURE0);
		ctx.bindTexture(ctx.TEXTURE_2D, tex);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);

		ctx.pixelStorei(WebGL2RenderingContext.UNPACK_FLIP_Y_WEBGL, true);
		return ctx;
	})();

	ctx.viewport(0, 0, canvas.width, canvas.height);

	ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, img);
	img.close();
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	const themeShader: Shader = _isThemeShader ??= new Shader(ctx, `\
#version 300 es

in vec2 aVertexPosition;
out vec2 vTexPos;

void main(void) {
	gl_Position = vec4(aVertexPosition, 0.0, 1.0);
	vTexPos = aVertexPosition * 0.5 + vec2(0.5);
}
`, `\
#version 300 es
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uTexSize;

in vec2 vTexPos;
out vec4 outColor;

void main() {
    vec4 texColor = texture(uTexture, vTexPos);
	float hereLum = (0.2126*texColor.r + 0.7152*texColor.g + 0.0722*texColor.b) * texColor.a;
    vec4 texColor2 = texture(uTexture, vTexPos + vec2(uTexSize.x, 0.0));
	float rightLum = (0.2126*texColor2.r + 0.7152*texColor2.g + 0.0722*texColor2.b) * texColor2.a;
    vec4 texColor3 = texture(uTexture, vTexPos + vec2(0.0, uTexSize.y));
	float downLum = (0.2126*texColor3.r + 0.7152*texColor3.g + 0.0722*texColor3.b) * texColor3.a;
    outColor = vec4(vec3(step(0.01, rightLum / 2.0 + downLum / 2.0 - hereLum)), 1.0);
}
`);
	themeShader.prepare({ aVertexPosition: 0 });
	themeShader.use({
		uTexSize: {
			type: 'uniform2f',
			value: [1 / canvas.width, 1 / canvas.height],
		},
		uTexture: {
			type: 'uniform1i',
			value: [0],
		},
	});
	ctx.drawElements(
		WebGL2RenderingContext.TRIANGLES,
		6,
		WebGL2RenderingContext.UNSIGNED_BYTE,
		0);
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	const canvas2 = _canvas2 ??= new OffscreenCanvas(1, 1);
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	const ctx2 = _ctx2 ??= canvas2.getContext('2d', { willReadFrequently: true }) ?? raise("no canvas ctx 2d");
	let w: number;
	let h: number;
	w = canvas2.width = Math.ceil(canvas.width / 2);
	h = canvas2.height = Math.ceil(canvas.height / 2);
	ctx2.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
	while (w > 1 || h > 1) {
		const wNext = Math.ceil(w / 2);
		const hNext = Math.ceil(h / 2);
		ctx2.drawImage(canvas2, 0, 0, w, h, 0, 0, wNext, hNext);
		w = wNext;
		h = hNext;
	}
	const avgDLum = ctx2.getImageData(0, 0, 1, 1).data[0] / 255;
	const threshold = Math.exp(-width * height / 1e4) + 0.02;
	if (avgDLum < threshold) {
		// very "flat" colored, diagramatic image
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		const transparentShader: Shader = _translucentShader ??= new Shader(ctx, `\
#version 300 es

in vec2 aVertexPosition;
out vec2 vTexPos;

void main(void) {
	gl_Position = vec4(aVertexPosition, 0.0, 1.0);
	vTexPos = aVertexPosition * 0.5 + vec2(0.5);
}
`, `\
#version 300 es
precision highp float;

uniform sampler2D uTexture;

in vec2 vTexPos;
out vec4 outColor;

void main() {
    vec4 texColor = texture(uTexture, vTexPos);
	texColor *= smoothstep(0.9, 0.5, 0.2126*texColor.r + 0.7152*texColor.g + 0.0722*texColor.b);
	outColor = texColor;
}
`);
		transparentShader.prepare({ aVertexPosition: 0 });
		transparentShader.use({
			uTexture: {
				type: 'uniform1i',
				value: [0],
			},
		});
		ctx.drawElements(
			WebGL2RenderingContext.TRIANGLES,
			6,
			WebGL2RenderingContext.UNSIGNED_BYTE,
			0);
		// const cv3 = new OffscreenCanvas(canvas.width, canvas.height);
		// const c3 = cv3.getContext('2d') ?? raise("no canvas ctx");
		// c3.drawImage(canvas, 0, 0);
		// ctx2.fillStyle = "#00ff00";
		// ctx2.font = "12px system-ui";
		// ctx2.fillText(`${avgDLum}`, 3, 15);
		// return canvas2.convertToBlob();
		return canvas.convertToBlob();
	}
	return null;
}
