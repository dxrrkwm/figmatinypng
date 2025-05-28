// code.ts — Figma Plugin main script in TypeScript

figma.showUI(__html__, { width: 300, height: 300 });

const COMPONENT_TYPES = {
  TEXT_BLOCK: 'text-block',
  ATTENTION: 'attention-text-block',
  CTA: 'cta-text-block',
  SECONDARY_BUTTON: 'secondary-button',
  PRIMARY_BUTTON: 'primary-button',
  LOGO: 'logo',
  HERO: 'hero-banner',
};

function getComponentType(nodeName: string): string | null {
  const name = nodeName.toLowerCase();
  if (name.includes('attention')) return COMPONENT_TYPES.ATTENTION;
  if (name.includes('cta')) return COMPONENT_TYPES.CTA;
  if (name.includes('secondary button')) return COMPONENT_TYPES.SECONDARY_BUTTON;
  if (name.includes('primary button')) return COMPONENT_TYPES.PRIMARY_BUTTON;
  if (name.includes('logo')) return COMPONENT_TYPES.LOGO;
  if (name.includes('hero')) return COMPONENT_TYPES.HERO;
  if (name.includes('text')) return COMPONENT_TYPES.TEXT_BLOCK;
  return null;
}

function extractTextByStyle(node: SceneNode): { heading: string; body: string; label: string } {
  let heading = '';
  let body = '';
  let label = '';

  function walk(n: SceneNode) {
    if ('children' in n) {
      for (const child of n.children) {
        walk(child);
      }
    }

    if (n.type === 'TEXT') {
      const name = n.name.trim().toLowerCase();
      const content = n.characters.trim();

      if (!content) return;

      if (name === 'headline') heading += content + ' ';
      else if (name === 'body text') body += content + ' ';
      else if (name === 'label') label += content + ' ';
    }
  }

  walk(node);

  return {
    heading: heading.trim(),
    body: body.trim(),
    label: label.trim(),
  };
}


function generateCode(node: SceneNode, type: string): string {
  const text = extractTextByStyle(node);
  switch (type) {
    case COMPONENT_TYPES.TEXT_BLOCK:
      return `<x-box :background="Component.utils.background('', '#ffffff')" width="auto" margin="24px 0px" padding="24px" border-radius="24px 24px 24px 24px"><x-heading-2 margin="0px 0px 12px">${text.heading}</x-heading-2><x-paragraph margin="0px">${text.body}</x-paragraph></x-box>`;
    case COMPONENT_TYPES.ATTENTION:
      return `<x-box :background="Component.utils.background('', globalStyles.colors.lavender_6blqnmcrl8ky)" width="auto" margin="24px 0px" padding="24px" border-radius="24px 24px 24px 24px"><x-heading-2 margin="0px 0px 12px">${text.heading}</x-heading-2><x-paragraph margin="0px">${text.body}</x-paragraph></x-box>`;
    case COMPONENT_TYPES.CTA:
      return `<x-box :background="Component.utils.background('', globalStyles.colors.mint_o2kodsw131o7)" width="auto" margin="24px 0px" padding="24px" border-radius="24px 24px 24px 24px"><x-heading-2 margin="0px 0px 12px">${text.heading}</x-heading-2><x-paragraph margin="0px">${text.body}</x-paragraph></x-box>`;
    case COMPONENT_TYPES.SECONDARY_BUTTON:
      return `<x-cta href="https://mate.academy/" margin="32px 0px" background="#2a2f3c">${text.label}</x-cta>`;
    case COMPONENT_TYPES.PRIMARY_BUTTON:
      return `<x-cta href="https://mate.academy/" margin="24px 0px" :font-size="18">${text.label}</x-cta>`;
    default:
      return '';
  }
}

figma.ui.onmessage = (msg: { type: string }) => {
  if (msg.type === 'analyze-components') {
    const currentFrame = figma.currentPage.selection[0];
    if (!currentFrame || currentFrame.type !== 'FRAME') {
      figma.notify('Please select a frame.');
      return;
    }

    const result: string[] = [];

    function processNode(node: SceneNode) {
      if ('name' in node) {
        const type = getComponentType(node.name);
        if (type && type !== COMPONENT_TYPES.LOGO && type !== COMPONENT_TYPES.HERO) {
          result.push(generateCode(node, type));
        }
      }
      if ('children' in node) {
        for (const child of node.children) {
          processNode(child);
        }
      }
    }

    processNode(currentFrame);

    figma.ui.postMessage({ type: 'customerio-code', code: result.join('\n\n') });
  }
};