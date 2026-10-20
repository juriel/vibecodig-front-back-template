import { createElement, IconNode } from 'lucide';

/** Ícono de Lucide como <svg> (Lit lo inserta tal cual en el template). */
export const icon = (node: IconNode, size = 18) => {
  const el = createElement(node);
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('aria-hidden', 'true');
  return el;
};
