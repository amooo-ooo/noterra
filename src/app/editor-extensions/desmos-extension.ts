import { Node } from '@tiptap/core';
import Desmos from 'desmos';
import { parse } from 'mathjs';

import style from '@/app/styles/desmos-extension.module.scss';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    desmosGraph: {
      setDesmosGraph: (expressions: DesmosExpression[]) => ReturnType;
    };
  }
}

export type DesmosExpression = {
  expression: string;
  color?: string;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
};

const parseToLatex = (expression: string) => {
  try {
    const parsed = parse(expression);
    return parsed.toTex();
  } catch (err) {
    console.error(`Failed to parse expression: ${expression}`, err);
    return expression;
  }
};

export const DesmosGraph = Node.create({
  name: 'desmosGraph',

  addOptions() {
    return {
      defaultLineStyle: 'solid',
      lineColors: ['#c74440', '#2d70b3', '#388c46', '#fa7e19', '#6042a6', '#000000'],
      HTMLAttributes: {},
    };
  },

  content: 'text*',
  group: 'block',
  inline: false,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      expressions: {
        default: [] as DesmosExpression[],
        parseHTML: (element) => {
          const data = element.getAttribute('data-expressions');
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes) => {
          if (!attributes.expressions || attributes.expressions.length === 0) {
            return {};
          }
          return { 'data-expressions': JSON.stringify(attributes.expressions) };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="desmos-graph"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { expressions, ...restAttributes } = HTMLAttributes;
    return ['div', { ...this.options.HTMLAttributes, ...restAttributes, 'data-type': 'desmos-graph', 'data-expressions': JSON.stringify(expressions) }, 0];
  },

  addNodeView() {
    return ({ node }) => {
      const container = document.createElement('div');
      const graphContainer = document.createElement('div');

      container.classList.add(style.desmos);
      graphContainer.classList.add(style['desmos-container']);

      container.appendChild(graphContainer);
      const calculator = Desmos.GraphingCalculator(graphContainer);

      let colorIndex = 0;

      const getNextColor = () => {
        const color = this.options.lineColors[colorIndex];
        colorIndex = (colorIndex + 1) % this.options.lineColors.length;
        return color;
      };

      const loadExpressions = (expressions: DesmosExpression[]) => {
        calculator.setBlank();
        for (const { expression, lineStyle, color } of expressions) {
          const latexExpression = parseToLatex(expression);
          calculator.setExpression({
            latex: latexExpression,
            lineStyle: lineStyle || this.options.defaultLineStyle,
            color: color || getNextColor(),
          });
        }
      };

      loadExpressions(node.attrs.expressions);

      return {
        dom: container,
        update(updatedNode) {
          if (JSON.stringify(updatedNode.attrs.expressions) !== JSON.stringify(node.attrs.expressions)) {
            loadExpressions(updatedNode.attrs.expressions);
          }
          return true;
        },
        destroy: calculator.destroy.bind(calculator),
      };
    };
  },

  addCommands() {
    return {
      setDesmosGraph: (expressions: DesmosExpression[]) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { expressions },
        });
      },
    };
  },
});
