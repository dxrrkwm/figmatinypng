// Modified main plugin code (code.js)
"use strict";
figma.showUI(__html__, { width: 400, height: 500 });

const componentMappings = {
    'Text Block': {
        template: '<x-box :background="Component.utils.background(\'\', \'#ffffff\')" width="auto" margin="24px 0px" padding="24px" border-radius="24px 24px 24px 24px"><x-heading-2 margin="0px 0px 12px">{{HEADLINE}}</x-heading-2><x-paragraph margin="0px">{{BODY_TEXT}}</x-paragraph></x-box>',
        textFields: ['Headline', 'Body Text']
    },
    'Attention Text Block': {
        template: '<x-box :background="Component.utils.background(\'\', globalStyles.colors.lavender_6blqnmcrl8ky)" width="auto" margin="24px 0px" padding="24px" border-radius="24px 24px 24px 24px"><x-heading-2 margin="0px 0px 12px">{{HEADLINE}}</x-heading-2><x-paragraph margin="0px">{{BODY_TEXT}}</x-paragraph></x-box>',
        textFields: ['Headline', 'Body Text']
    },
    'CTA Text Block': {
        template: '<x-box :background="Component.utils.background(\'\', globalStyles.colors.mint_o2kodsw131o7)" width="auto" margin="24px 0px" padding="24px" border-radius="24px 24px 24px 24px"><x-heading-2 margin="0px 0px 12px">{{HEADLINE}}</x-heading-2><x-paragraph margin="0px">{{BODY_TEXT}}</x-paragraph></x-box>',
        textFields: ['Headline', 'Body Text']
    },
    'Primary Button': {
        template: '<x-cta href="https://mate.academy/" margin="24px 0px" :font-size="18">{{LABEL}}</x-cta>',
        textFields: ['Label']
    },
    'Secondary Button': {
        template: '<x-cta href="https://mate.academy/" margin="32px 0px" background="#2a2f3c">{{LABEL}}</x-cta>',
        textFields: ['Label']
    }
};

const HEADER = `<x-base :background="Component.utils.background('', globalStyles.colors.backgrounddefault_9jv8tl2jff3e)" text-align="left"   dir="auto" font-family="'Manrope', sans-serif">
  <x-section width="600px" padding="20px 20px 0px" outer-background="">
<logo-default></logo-default>`;

const FOOTER = `<footer-default></footer-default></x-section>
</x-base>`;

function extractTextFromNode(node, targetName) {
    if (node.type === 'TEXT' && node.name === targetName) {
        return node.characters;
    }
    if ('children' in node) {
        for (const child of node.children) {
            const result = extractTextFromNode(child, targetName);
            if (result) return result;
        }
    }
    return '';
}

function processComponent(node) {
    const componentName = node.name;
    const mapping = componentMappings[componentName];
    if (!mapping) return null;

    let template = mapping.template;
    // Extract text for each required field
    for (const fieldName of mapping.textFields) {
        const text = extractTextFromNode(node, fieldName);
        const placeholder = `{{${fieldName.toUpperCase().replace(' ', '_')}}}`;
        template = template.replace(placeholder, text || `Default ${fieldName}`);
    }
    return template;
}

function findComponentsInSelection() {
    const selection = figma.currentPage.selection;
    const components = [];

    function traverseNode(node) {
        // Check if this node is a recognized component
        const processedComponent = processComponent(node);
        if (processedComponent) {
            components.push(processedComponent);
        }
        // Traverse children if they exist
        if ('children' in node) {
            for (const child of node.children) {
                traverseNode(child);
            }
        }
    }

    if (selection.length === 0) {
        // If nothing is selected, search the entire page
        for (const node of figma.currentPage.children) {
            traverseNode(node);
        }
    } else {
        // Search within selected nodes
        for (const node of selection) {
            traverseNode(node);
        }
    }

    return components;
}

// Image export functionality
function findImageNodes() {
    const selection = figma.currentPage.selection;
    const imageNodes = [];

    function traverseNode(node) {
        // Check if this node is named "Hero Banner" or "Image"
        if (node.name === 'Hero Banner' || node.name === 'Image') {
            // Add any node with these names - we can export any visual node
            imageNodes.push(node);
        }
        
        // Traverse children if they exist
        if ('children' in node) {
            for (const child of node.children) {
                traverseNode(child);
            }
        }
    }

    if (selection.length === 0) {
        // If nothing is selected, search the entire page
        for (const node of figma.currentPage.children) {
            traverseNode(node);
        }
    } else {
        // Search within selected nodes
        for (const node of selection) {
            traverseNode(node);
        }
    }

    return imageNodes;
}

// FIXED: Modified export function to send all images at once
async function exportImages() {
    const imageNodes = findImageNodes();
    
    if (imageNodes.length === 0) {
        return { success: true, count: 0 };
    }

    const exportedImages = [];

    for (const node of imageNodes) {
      try {
          // Calculate appropriate scale to balance quality and file size
          let scale = 2; // Start with 2x for better quality
          const nodeArea = node.width * node.height;
          
          // Adjust scale based on node size to maintain quality while controlling file size
          if (nodeArea > 2000000) { // 2M pixels - very large
              scale = 1;
          } else if (nodeArea > 1000000) { // 1M pixels - large
              scale = 1.5;
          } else if (nodeArea > 500000) { // 500K pixels - medium
              scale = 2;
          } else {
              scale = 2.5; // Small nodes can handle higher quality
          }

          // First try PNG with higher quality
          const imageData = await node.exportAsync({
              format: 'PNG',
              constraint: { type: 'SCALE', value: scale }
          });

          let finalImageData = imageData;
          let format = 'png';
          
          // If PNG is too large (over 1MB), try JPG with same scale but higher quality
          if (imageData.byteLength > 1024 * 1024) {
              finalImageData = await node.exportAsync({
                  format: 'JPG',
                  constraint: { type: 'SCALE', value: scale },
                  // No quality setting means maximum quality for JPG
              });
              format = 'jpg';
          }

          // Only reduce scale if still over 1.5MB
          if (finalImageData.byteLength > 1536 * 1024 && scale > 1) {
              finalImageData = await node.exportAsync({
                  format: 'JPG',
                  constraint: { type: 'SCALE', value: Math.max(1, scale * 0.7) }
              });
          }

          // Store image data instead of sending immediately
          exportedImages.push({
              name: node.name,
              imageData: Array.from(finalImageData),
              filename: `${node.name.replace(/\s+/g, '_')}_${Date.now() + exportedImages.length}.${format}`
          });

      } catch (error) {
          console.error(`Failed to export ${node.name}:`, error);
      }
  }

    // Send all images at once to the UI
    figma.ui.postMessage({
        type: 'download-images-batch',
        images: exportedImages
    });

    return { success: true, count: exportedImages.length };
}

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'generate-code') {
        try {
            const components = findComponentsInSelection();
            
            if (components.length === 0) {
                figma.ui.postMessage({
                    type: 'code-generated',
                    code: '',
                    error: 'No recognized components found. Make sure your components are named: "Text Block", "Attention Text Block", "CTA Text Block", "Primary Button", or "Secondary Button".'
                });
                return;
            }

            // Combine header, components, and footer
            const fullCode = HEADER + '\n' + components.join('\n') + '\n' + FOOTER;

            figma.ui.postMessage({
                type: 'code-generated',
                code: fullCode,
                error: null
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            figma.ui.postMessage({
                type: 'code-generated',
                code: '',
                error: `Error generating code: ${errorMessage}`
            });
        }
    }

    if (msg.type === 'export-images') {
        try {
            const result = await exportImages();
            
            figma.ui.postMessage({
                type: 'images-exported',
                imageCount: result.count,
                error: result.success ? null : 'Failed to export images'
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            figma.ui.postMessage({
                type: 'images-exported',
                imageCount: 0,
                error: `Error exporting images: ${errorMessage}`
            });
        }
    }

    if (msg.type === 'close-plugin') {
        figma.closePlugin();
    }
};