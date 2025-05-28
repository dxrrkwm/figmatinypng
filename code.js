figma.showUI(__html__, { width: 300, height: 300 });

const COMPONENT_TYPES = {
  TEXT_BLOCK: 'text-block',
  ATTENTION: 'attention-text-block',
  CTA: 'cta-text-block',
  SECONDARY_BUTTON: 'secondary-button',
  PRIMARY_BUTTON: 'primary-button',
  LOGO: 'logo',
  HERO: 'hero-banner'
};

function getComponentType(nodeName) {
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

function extractTextByStyle(node) {
  let heading = '';
  let body = '';
  let label = '';

  function walk(n) {
    if ('children' in n) {
      for (const child of n.children) {
        walk(child);
      }
    }

    if (n.type === 'TEXT') {
      const name = n.name.trim().toLowerCase();
      const content = n.characters.trim();
      if (!content) return;

      if (name.includes('headline')) heading += content + ' ';
      else if (name.includes('body text')) body += content + ' ';
      else if (name.includes('label')) label += content + ' ';
    }
  }

  walk(node);

  return {
    heading: heading.trim(),
    body: body.trim(),
    label: label.trim()
  };
}

function generateCode(node, type) {
  const text = extractTextByStyle(node);

  switch (type) {
    case COMPONENT_TYPES.TEXT_BLOCK:
      if (!text.heading && !text.body) return '';
      return `<x-box :background="Component.utils.background('', '#ffffff')" width="auto" margin="24px 0px" padding="24px" border-radius="24px 24px 24px 24px">
  <x-heading-2 margin="0px 0px 12px">${text.heading}</x-heading-2>
  <x-paragraph margin="0px">${text.body}</x-paragraph>
</x-box>`;

    case COMPONENT_TYPES.ATTENTION:
      return `<x-box :background="Component.utils.background('', globalStyles.colors.lavender_6blqnmcrl8ky)" width="auto" margin="24px 0px" padding="24px" border-radius="24px 24px 24px 24px">
  <x-heading-2 margin="0px 0px 12px">${text.heading}</x-heading-2>
  <x-paragraph margin="0px">${text.body}</x-paragraph>
</x-box>`;

    case COMPONENT_TYPES.CTA:
      return `<x-box :background="Component.utils.background('', globalStyles.colors.mint_o2kodsw131o7)" width="auto" margin="24px 0px" padding="24px" border-radius="24px 24px 24px 24px">
  <x-heading-2 margin="0px 0px 12px">${text.heading}</x-heading-2>
  <x-paragraph margin="0px">${text.body}</x-paragraph>
</x-box>`;

    case COMPONENT_TYPES.SECONDARY_BUTTON:
      return `<x-cta href="https://mate.academy/" margin="32px 0px" background="#2a2f3c">${text.label}</x-cta>`;

    case COMPONENT_TYPES.PRIMARY_BUTTON:
      return `<x-cta href="https://mate.academy/" margin="24px 0px" :font-size="18">${text.label}</x-cta>`;

    default:
      return '';
  }
}

figma.ui.onmessage = (msg) => {
  if (msg.type === 'analyze-components') {
    const currentFrame = figma.currentPage.selection[0];

    if (!currentFrame || currentFrame.type !== 'FRAME') {
      figma.notify('Please select a frame.');
      return;
    }

    const bodyComponents = [];

    for (const node of currentFrame.children) {
      const type = getComponentType(node.name);

      // Skip Hero and Logo components
      if (!type || type === COMPONENT_TYPES.HERO || type === COMPONENT_TYPES.LOGO) continue;

      const code = generateCode(node, type);
      if (code) bodyComponents.push(code);
    }

    const header = `<x-base :background="Component.utils.background('', globalStyles.colors.backgrounddefault_9jv8tl2jff3e)" text-align="left" dir="auto" font-family="'Manrope', sans-serif">
  <x-section width="600px" padding="20px 20px 0px" outer-background="">
    <logo-default></logo-default>`;

    const footer = `<footer-default></footer-default></x-section>
</x-base>`;

    const finalCode = [header, ...bodyComponents, footer].join('\n\n');

    figma.ui.postMessage({ type: 'customerio-code', code: finalCode });
  }
};