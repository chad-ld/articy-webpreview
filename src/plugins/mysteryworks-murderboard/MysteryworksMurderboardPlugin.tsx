/**
 * Mysteryworks Murderboard Plugin
 * A plugin for displaying and managing murder mystery investigation boards
 */

import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { FileSearchOutlined } from '@ant-design/icons';
import { IPlugin, PluginMetadata, PluginButtonConfig, PluginModalProps, PluginContext } from '../types';
import EvidencePopup from './EvidencePopup';

// Import the layout structure
import layoutData from './murderboard_template.psd-structure.json';

// Define types for the layout structure
interface LayoutElement {
  name: string;
  type: string;
  options: any;
  offset: { left: number; top: number };
  size: { width: number; height: number };
  relativePath: string;
  children: any[];
}

interface LayoutRoot {
  type: string;
  options: any;
  size: { width: number; height: number };
  children: LayoutElement[];
}

// Function to get asset URL for Vite
const getAssetUrl = (fileName: string) => {
  return new URL(`./murderboard_template.psd-assets/${fileName}`, import.meta.url).href;
};

// Dynamic murderboard component with variable-based visibility
interface MurderboardCanvasProps {
  variables?: any;
  project?: any; // Add project data access
}

const MurderboardCanvasWithResize: React.FC<MurderboardCanvasProps> = ({ variables, project }) => {
  // Evidence popup state
  const [evidencePopup, setEvidencePopup] = useState({
    isVisible: false,
    evidenceName: '',
    content: ''
  });

  // Cache for pre-evaluated evidence content (updated when murderboard opens)
  const [evidenceContentCache, setEvidenceContentCache] = useState<{
    [evidenceName: string]: {
      title: string;
      content: string;
      fragmentId: string;
    }
  }>({});

  // Phase 6: Update tracking state
  const [evidenceFragmentIds, setEvidenceFragmentIds] = useState<{[evidenceName: string]: string}>({});
  const [updateIndicators, setUpdateIndicators] = useState<{[evidenceName: string]: boolean}>({});

  // Trigger for forcing re-evaluation
  const [evaluationTrigger, setEvaluationTrigger] = useState(0);

  // Pre-evaluate all evidence content when murderboard opens (triggered by evaluationTrigger)
  useEffect(() => {
    if (variables && project) {
      console.log(`🔄 Murderboard opened - Pre-evaluating all evidence with current variable states...`);
      console.log(`🔄 Variables available:`, !!variables);
      console.log(`🔄 Project available:`, !!project);

      // Always clear existing cache to force fresh evaluation based on current variables
      console.log(`🗑️ Clearing evidence content cache for fresh evaluation...`);
      setEvidenceContentCache({});

      // Pre-evaluate all evidence with current variable states
      preEvaluateAllEvidence();
    } else {
      console.log(`⚠️ Skipping pre-evaluation: variables=${!!variables}, project=${!!project}`);
    }
  }, [evaluationTrigger]); // Only re-run when murderboard opens (evaluationTrigger changes)

  // Trigger fresh evaluation every time murderboard component mounts (when modal opens)
  useEffect(() => {
    console.log(`🔄 Murderboard modal opened, triggering fresh evidence evaluation...`);
    setEvaluationTrigger(prev => prev + 1);
  }, []); // Only run once when component mounts (each time modal opens)

  // Phase 6: Check for content updates when murderboard opens (part of fresh evaluation)
  useEffect(() => {
    if (!variables || !project) return;

    console.log(`🔄 Checking for evidence content updates on murderboard open...`);
    checkForContentUpdates();
  }, [evaluationTrigger]); // Only run when murderboard opens

  // Phase 6: Check for content updates for all visible evidence
  const checkForContentUpdates = () => {
    if (!variables || !project) return;

    const layout = layoutData as LayoutRoot;
    const newUpdateIndicators: {[evidenceName: string]: boolean} = {};

    // Check each evidence image for content changes
    for (const element of layout.children) {
      const baseEvidenceName = element.name.replace(/\.(png|jpg|jpeg)$/i, '');

      // Skip non-evidence images
      if (!isEvidenceImage(element.name)) continue;

      // Check if evidence is visible
      if (!isElementVisible(element.name)) continue;

      console.log(`🔍 Checking content updates for: ${baseEvidenceName}`);

      // Get current content for this evidence
      const characterName = getCharacterNameForEvidence(baseEvidenceName);
      const dialogueFragments = findDialogueFragmentsByCharacter(characterName);
      const currentContent = selectContentByConditions(dialogueFragments);

      // Compare with stored fragment ID
      const storedFragmentId = evidenceFragmentIds[baseEvidenceName];
      const currentFragmentId = currentContent.fragmentId;

      if (storedFragmentId && currentFragmentId && storedFragmentId !== currentFragmentId) {
        console.log(`🔔 Content changed for ${baseEvidenceName}: ${storedFragmentId} → ${currentFragmentId}`);
        newUpdateIndicators[baseEvidenceName] = true;
      } else {
        console.log(`✅ No content change for ${baseEvidenceName}`);
        newUpdateIndicators[baseEvidenceName] = false;
      }
    }

    // Update the indicators state
    setUpdateIndicators(newUpdateIndicators);
  };

  // Pre-evaluate all visible evidence content when murderboard opens
  const preEvaluateAllEvidence = () => {
    if (!variables || !project) {
      console.log(`⚠️ Cannot pre-evaluate evidence: missing variables or project`);
      return;
    }

    console.log(`🔄 Pre-evaluating all visible evidence content...`);
    const layout = layoutData as LayoutRoot;
    const newContentCache: typeof evidenceContentCache = {};

    // Process each evidence image
    for (const element of layout.children) {
      const baseEvidenceName = element.name.replace(/\.(png|jpg|jpeg)$/i, '');

      // Check if this is evidence (has _found variable)
      const foundVariableName = `${baseEvidenceName}_found`;
      let isEvidenceFound = false;

      // Look through all variable namespaces for the found variable (same logic as isElementVisible)
      if (variables) {
        for (const namespace in variables) {
          const namespaceVars = variables[namespace];
          if (namespaceVars) {
            // Check for exact match first
            if (namespaceVars[foundVariableName] === true) {
              isEvidenceFound = true;
              break;
            }
            // Check for case-insensitive match
            for (const varName in namespaceVars) {
              if (varName.toLowerCase() === foundVariableName.toLowerCase() && namespaceVars[varName] === true) {
                isEvidenceFound = true;
                break;
              }
            }
            if (isEvidenceFound) break;
          }
        }
      }

      if (isEvidenceFound) {
        console.log(`🔍 Pre-evaluating evidence: ${baseEvidenceName}`);

        // Get character name for this evidence
        const characterName = getCharacterNameForEvidence(baseEvidenceName);
        if (characterName) {
          // Find dialogue fragments for this character
          const dialogueFragments = findDialogueFragmentsByCharacter(characterName);

          // Select content based on current conditions
          const selectedContent = selectContentByConditions(dialogueFragments);

          // Cache the result
          newContentCache[baseEvidenceName] = {
            title: characterName,
            content: selectedContent.content,
            fragmentId: selectedContent.fragmentId
          };

          console.log(`✅ Cached content for ${baseEvidenceName}: ${selectedContent.content.substring(0, 50)}...`);
        }
      }
    }

    // Update the cache
    setEvidenceContentCache(newContentCache);
    console.log(`🎯 Pre-evaluation complete. Cached ${Object.keys(newContentCache).length} evidence items.`);
  };

  // Phase 2: Enhanced evidence click handler with character name resolution
  const handleEvidenceClick = (imageName: string) => {
    console.log(`🔍 Evidence clicked: ${imageName}`);
    console.log(`🔍 Current variables:`, variables);
    console.log(`🔍 Project available:`, !!project);
    console.log(`🔍 Project type:`, typeof project);
    console.log(`🔍 Project keys:`, project ? Object.keys(project).slice(0, 10) : 'None');
    console.log(`🔍 Project constructor:`, project ? project.constructor?.name : 'No project');
    console.log(`🔍 Project full structure:`, project);
    console.log(`🔍 Project data structure:`, project ? {
      hasData: !!project.data,
      hasPackages: !!project.data?.Packages,
      packageCount: project.data?.Packages?.length || 0,
      dataType: typeof project.data,
      isArticyProject: project.constructor?.name,
      projectMethods: project ? Object.getOwnPropertyNames(Object.getPrototypeOf(project)) : []
    } : 'No project');

    // Step 1: Extract base evidence name (remove file extension)
    const baseEvidenceName = imageName.replace(/\.(png|jpg|jpeg)$/i, '');
    console.log(`📝 Base evidence name: ${baseEvidenceName}`);

    // Step 2: Check if we have cached content for this evidence
    const cachedContent = evidenceContentCache[baseEvidenceName];

    if (cachedContent) {
      console.log(`✅ Using cached content for ${baseEvidenceName}`);
      // Display the popup with cached content
      setEvidencePopup({
        isVisible: true,
        evidenceName: cachedContent.title,
        content: cachedContent.content
      });
      return;
    }

    console.log(`⚠️ No cached content found for ${baseEvidenceName}, falling back to real-time evaluation`);

    // Fallback: Real-time evaluation (same as before)
    const characterName = getCharacterNameForEvidence(baseEvidenceName);
    console.log(`👤 Character name resolved: "${characterName}"`);

    const dialogueFragments = findDialogueFragmentsByCharacter(characterName);
    console.log(`💬 Found ${dialogueFragments.length} dialogue fragments for speaker: "${characterName}"`);

    const selectedContent = selectContentByConditions(dialogueFragments);
    console.log(`📋 Selected content:`, selectedContent);

    // Phase 6: Update tracking - store current fragment ID and clear update indicator
    if (selectedContent.fragmentId) {
      setEvidenceFragmentIds(prev => ({
        ...prev,
        [baseEvidenceName]: selectedContent.fragmentId
      }));

      // Clear update indicator for this evidence
      setUpdateIndicators(prev => ({
        ...prev,
        [baseEvidenceName]: false
      }));

      console.log(`📝 Stored fragment ID for ${baseEvidenceName}: ${selectedContent.fragmentId}`);
    }

    // If no dialogue content found, create evidence information from variables
    let finalContent = selectedContent.content;
    if (selectedContent.content === "No information available for this evidence.") {
      finalContent = createEvidenceInfoFromVariables(baseEvidenceName, characterName);
    }

    // Display the popup with resolved content
    setEvidencePopup({
      isVisible: true,
      evidenceName: characterName || baseEvidenceName.replace(/_/g, ' '),
      content: finalContent
    });
  };

  // Create evidence information from variables when no dialogue is available
  const createEvidenceInfoFromVariables = (evidenceName: string, characterName: string): string => {
    if (!variables) {
      return "No information available for this evidence.";
    }

    const info: string[] = [];

    // Add character name if available
    if (characterName && characterName !== evidenceName.replace(/_/g, ' ')) {
      info.push(`**Evidence Type:** ${characterName}`);
    }

    // Look for related variables
    const evidenceVars = variables.EvidenceVariables || {};
    const relatedVars: string[] = [];

    Object.keys(evidenceVars).forEach(key => {
      if (key.toLowerCase().includes(evidenceName.toLowerCase())) {
        const value = evidenceVars[key];
        if (value !== undefined && value !== null && value !== false && value !== "false") {
          relatedVars.push(`• ${key.replace(/_/g, ' ')}: ${value}`);
        }
      }
    });

    if (relatedVars.length > 0) {
      info.push(`**Related Information:**`);
      info.push(...relatedVars);
    }

    if (info.length === 0) {
      return `**${characterName || evidenceName.replace(/_/g, ' ')}**\n\nThis evidence has been discovered but no additional dialogue content is currently available in the project data.`;
    }

    return info.join('\n');
  };

  // Close evidence popup
  const closeEvidencePopup = () => {
    setEvidencePopup({
      isVisible: false,
      evidenceName: '',
      content: ''
    });
  };

  // Phase 2: Character name resolution
  const getCharacterNameForEvidence = (evidenceName: string): string => {
    if (!variables) {
      console.log(`⚠️ No variables available for character name lookup: ${evidenceName}`);
      return evidenceName.replace(/_/g, ' ');
    }

    const charNameVariable = `${evidenceName}_charname`;
    console.log(`🔍 Looking for character name variable: ${charNameVariable}`);

    // Search through all namespaces case-insensitively
    for (const namespace in variables) {
      const namespaceVars = variables[namespace];
      if (namespaceVars) {
        for (const varName in namespaceVars) {
          if (varName.toLowerCase() === charNameVariable.toLowerCase()) {
            const characterName = namespaceVars[varName];
            console.log(`✅ Found character name: ${characterName} (from ${namespace}.${varName})`);
            return characterName;
          }
        }
      }
    }

    // Fallback to formatted evidence name
    const fallbackName = evidenceName.replace(/_/g, ' ');
    console.log(`⚠️ Character name variable not found, using fallback: ${fallbackName}`);
    return fallbackName;
  };

  // Phase 2: Find dialogue fragments by character name
  const findDialogueFragmentsByCharacter = (characterName: string): any[] => {
    if (!project || !project.data || !project.data.Packages) {
      console.log(`⚠️ No project data available for dialogue fragment search`);
      return [];
    }

    // Step 1: Find the speaker ID for this character name
    const speakerId = findSpeakerIdByName(characterName);
    if (!speakerId) {
      console.log(`⚠️ No speaker ID found for character: "${characterName}"`);
      return [];
    }

    const dialogueFragments: any[] = [];
    console.log(`🔍 Searching for dialogue fragments with speaker ID: ${speakerId} (${characterName})`);

    // Debug: Log what types of models we have
    const modelTypes = new Set<string>();
    let totalModels = 0;
    let dialogueModels = 0;

    // Search through all packages and models
    for (const package_ of project.data.Packages) {
      for (const model of package_.Models || []) {
        totalModels++;
        modelTypes.add(model.Type);

        // Check if this is a dialogue-related model
        if (model.Type === 'DialogueInteractiveFragmentTemplate' || model.Type === 'DialogueExplorationFragmentTemplate' || model.Type === 'DialogueFragment') {
          dialogueModels++;

          // Log first few dialogue models for debugging
          if (dialogueModels <= 3) {
            console.log(`🔍 DEBUG: Sample dialogue model #${dialogueModels}:`, {
              type: model.Type,
              id: model.Properties?.Id,
              displayName: model.Properties?.DisplayName,
              technicalName: model.Properties?.TechnicalName,
              speaker: model.Properties?.Speaker,
              text: model.Properties?.Text?.substring(0, 100) + '...',
              hasInputPins: !!model.Properties?.InputPins,
              inputPinsCount: model.Properties?.InputPins?.length || 0
            });
          }

          // Check if speaker ID matches exactly
          if (model.Properties.Speaker === speakerId) {
            console.log(`💬 Found matching dialogue fragment:`, {
              id: model.Properties.Id,
              speakerId: model.Properties.Speaker,
              text: model.Properties.Text?.substring(0, 100) + '...',
              hasInputPins: !!model.Properties?.InputPins,
              inputPinsCount: model.Properties?.InputPins?.length || 0
            });
            dialogueFragments.push(model);
          }
        }
      }
    }

    console.log(`🔍 DEBUG: Found ${totalModels} total models with types:`, Array.from(modelTypes).sort());
    console.log(`🔍 DEBUG: Found ${dialogueModels} total dialogue models in project`);
    console.log(`📊 Found ${dialogueFragments.length} dialogue fragments for character: ${characterName}`);
    return dialogueFragments;
  };

  // Debug function: Find dialogue fragments by name/content
  const findDialogueFragmentsByName = (evidenceName: string): any[] => {
    if (!project || !project.data || !project.data.Packages) {
      console.log(`⚠️ No project data available for name-based dialogue fragment search`);
      return [];
    }

    const dialogueFragments: any[] = [];
    console.log(`🔍 DEBUG: Searching for dialogue fragments containing: "${evidenceName}"`);

    // Search through all packages and models
    for (const package_ of project.data.Packages) {
      for (const model of package_.Models || []) {
        // Check if this is a dialogue-related model
        if (model.Type === 'DialogueInteractiveFragmentTemplate' || model.Type === 'DialogueExplorationFragmentTemplate' || model.Type === 'DialogueFragment') {
          const displayName = model.Properties.DisplayName || '';
          const technicalName = model.Properties.TechnicalName || '';
          const text = model.Properties.Text || '';

          // Check if evidence name appears in any of these fields
          if (displayName.toLowerCase().includes(evidenceName.toLowerCase()) ||
              technicalName.toLowerCase().includes(evidenceName.toLowerCase()) ||
              text.toLowerCase().includes(evidenceName.toLowerCase())) {

            console.log(`🔍 DEBUG: Found matching dialogue fragment:`, {
              id: model.Properties.Id,
              displayName: displayName,
              technicalName: technicalName,
              speaker: model.Properties.Speaker,
              text: text?.substring(0, 100) + '...',
              inputPins: model.Properties.InputPins?.length || 0
            });
            dialogueFragments.push(model);
          }
        }
      }
    }

    console.log(`📊 DEBUG: Found ${dialogueFragments.length} dialogue fragments containing: ${evidenceName}`);
    return dialogueFragments;
  };

  // Find dialogue fragments by content (search for character name in dialogue text)
  const findDialogueFragmentsByContent = (characterName: string): any[] => {
    if (!project || !project.data || !project.data.Packages) {
      console.log(`⚠️ No project data available for content search`);
      return [];
    }

    const dialogueFragments: any[] = [];
    console.log(`🔍 Searching for dialogue fragments containing "${characterName}" in content`);

    // Search through all packages and models
    for (const package_ of project.data.Packages) {
      for (const model of package_.Models || []) {
        // Check if this is a dialogue-related model
        if (model.Type === 'DialogueInteractiveFragmentTemplate' || model.Type === 'DialogueExplorationFragmentTemplate' || model.Type === 'DialogueFragment') {
          const textKey = model.Properties.Text;
          if (textKey) {
            // Resolve the localized text
            const localizedText = resolveLocalizedText(textKey) || textKey;

            // Check if character name appears in the content
            if (localizedText.toLowerCase().includes(characterName.toLowerCase())) {
              console.log(`💬 Found dialogue fragment with character name in content:`, {
                id: model.Properties.Id,
                textKey: textKey,
                content: localizedText.substring(0, 100) + '...'
              });
              dialogueFragments.push(model);
            }
          }
        }
      }
    }

    console.log(`📊 Found ${dialogueFragments.length} dialogue fragments containing character name in content`);
    return dialogueFragments;
  };

  // Phase 2: Resolve speaker ID to speaker name
  const resolveSpeakerName = (speakerId: string): string | null => {
    if (!speakerId || !project || !project.data || !project.data.Packages) {
      return null;
    }

    // Find the entity with the matching ID
    for (const package_ of project.data.Packages) {
      for (const model of package_.Models || []) {
        if (model.Properties.Id === speakerId) {
          // DisplayName should already be resolved to actual text
          const displayName = model.Properties.DisplayName;
          if (displayName) {
            return displayName;
          }
          // Fallback to technical name
          return model.Properties.TechnicalName || null;
        }
      }
    }

    return null;
  };

  // Find speaker ID by display name (reverse lookup)
  const findSpeakerIdByName = (speakerName: string): string | null => {
    if (!speakerName || !project || !project.data || !project.data.Packages) {
      return null;
    }

    console.log(`🔍 Looking for speaker ID for name: "${speakerName}"`);

    let entitiesChecked = 0;
    let entitiesWithDisplayName = 0;
    let entitiesMatched = 0;

    // Find the entity with the matching display name
    for (const package_ of project.data.Packages) {
      for (const model of package_.Models || []) {
        entitiesChecked++;
        const displayName = model.Properties.DisplayName;
        if (displayName) {
          entitiesWithDisplayName++;

          // Debug: Log first few matches for "Autopsy" to see what we're finding
          if (displayName.toLowerCase().includes('autopsy')) {
            console.log(`🔍 DEBUG: Found entity with "autopsy" in name:`, {
              id: model.Properties.Id,
              type: model.Type,
              displayName: displayName,
              matches: displayName.toLowerCase() === speakerName.toLowerCase()
            });
          }

          // DisplayName should already be resolved to actual text
          if (displayName.toLowerCase() === speakerName.toLowerCase()) {
            console.log(`✅ Found speaker ID for "${speakerName}": ${model.Properties.Id}`);
            entitiesMatched++;
            return model.Properties.Id;
          }
        }
      }
    }

    console.log(`🔍 DEBUG: Checked ${entitiesChecked} entities, ${entitiesWithDisplayName} had display names, ${entitiesMatched} matched`);
    console.log(`⚠️ No speaker ID found for name: "${speakerName}"`);
    return null;
  };

  // Helper: Resolve localized text from localization key
  const resolveLocalizedText = (textKey: string): string | null => {
    if (!textKey || !project || !project.data || !project.data.Packages) {
      return null;
    }

    // Debug: Log the first few calls to see what's happening
    if (textKey.includes('Autopsy') || textKey.includes('3CD15F77')) {
      console.log(`🔍 DEBUG: Resolving localization for key: "${textKey}"`);
      console.log(`🔍 DEBUG: Project packages count:`, project.data.Packages.length);
    }

    // Search through all packages for localization data
    for (const package_ of project.data.Packages) {
      if (textKey.includes('Autopsy') || textKey.includes('3CD15F77')) {
        console.log(`🔍 DEBUG: Package has localization:`, !!package_.Localization);
        if (package_.Localization) {
          console.log(`🔍 DEBUG: Localization keys count:`, Object.keys(package_.Localization).length);
          console.log(`🔍 DEBUG: Has key "${textKey}":`, !!package_.Localization[textKey]);
        }
      }

      if (package_.Localization) {
        const localizationEntry = package_.Localization[textKey];
        if (localizationEntry && localizationEntry[''] && localizationEntry[''].Text) {
          if (textKey.includes('Autopsy') || textKey.includes('3CD15F77')) {
            console.log(`✅ DEBUG: Found localized text for "${textKey}":`, localizationEntry[''].Text);
          }
          return localizationEntry[''].Text;
        }
      }
    }

    if (textKey.includes('Autopsy') || textKey.includes('3CD15F77')) {
      console.log(`⚠️ DEBUG: No localized text found for key: "${textKey}"`);
    }
    return null;
  };

  // Phase 2: Select content based on input pin conditions
  const selectContentByConditions = (dialogueFragments: any[]): { content: string; fragmentId: string } => {
    if (dialogueFragments.length === 0) {
      return {
        content: 'No information available for this evidence.',
        fragmentId: ''
      };
    }

    // For now, use simple logic - find fragment with conditions that match, or use first fragment
    for (const fragment of dialogueFragments) {
      const inputPinConditions = getInputPinConditions(fragment);

      if (inputPinConditions.length === 0) {
        // No conditions - this is a default fragment
        console.log(`📋 Using default fragment (no conditions):`, fragment.Properties.Id);
        // Text should already be resolved to actual content
        const content = fragment.Properties.Text || 'No content available.';
        return {
          content: content,
          fragmentId: fragment.Properties.Id
        };
      }

      // Check if conditions are met
      console.log(`🔍 DEBUG: Evaluating conditions for fragment ${fragment.Properties.Id}:`, inputPinConditions);
      const conditionsMet = evaluateConditions(inputPinConditions);
      console.log(`🔍 DEBUG: Conditions result for fragment ${fragment.Properties.Id}:`, conditionsMet);

      if (conditionsMet) {
        console.log(`✅ Conditions met for fragment:`, fragment.Properties.Id);
        // Text should already be resolved to actual content
        const content = fragment.Properties.Text || 'No content available.';
        return {
          content: content,
          fragmentId: fragment.Properties.Id
        };
      }
    }

    // Fallback to first fragment if no conditions match
    const firstFragment = dialogueFragments[0];
    console.log(`⚠️ No conditions matched, using first fragment:`, firstFragment.Properties.Id);
    return {
      content: firstFragment.Properties.Text || 'No content available.',
      fragmentId: firstFragment.Properties.Id
    };
  };

  // Phase 2: Get input pin conditions for a dialogue fragment
  const getInputPinConditions = (fragment: any): string[] => {
    console.log(`🔍 DEBUG: Checking input pins for fragment:`, {
      id: fragment.Properties.Id,
      displayName: fragment.Properties.DisplayName,
      hasInputPins: !!fragment.Properties.InputPins,
      inputPinsType: typeof fragment.Properties.InputPins,
      inputPinsLength: fragment.Properties.InputPins?.length
    });

    if (!fragment.Properties.InputPins || !Array.isArray(fragment.Properties.InputPins)) {
      console.log(`⚠️ No input pins found for fragment ${fragment.Properties.Id}`);
      return [];
    }

    const conditions: string[] = [];
    for (const inputPin of fragment.Properties.InputPins) {
      console.log(`🔍 DEBUG: Input pin:`, inputPin);
      if (inputPin.Text && inputPin.Text.trim()) {
        conditions.push(inputPin.Text.trim());
      }
    }

    console.log(`🔍 Input pin conditions for fragment ${fragment.Properties.Id}:`, conditions);
    return conditions;
  };

  // Phase 5: Enhanced condition evaluation with complex expression support
  const evaluateConditions = (conditions: string[]): boolean => {
    if (conditions.length === 0) {
      return true; // No conditions means always true
    }

    if (!variables) {
      console.log(`⚠️ No variables available for condition evaluation`);
      return false;
    }

    // Phase 5: Enhanced condition evaluation with AND/OR support
    for (const condition of conditions) {
      console.log(`🧮 Evaluating complex condition: ${condition}`);

      const result = evaluateComplexCondition(condition);
      console.log(`📊 Complex condition result: ${result}`);

      if (!result) {
        return false; // All conditions must be true
      }
    }

    return true;
  };

  // Phase 5: Enhanced complex condition evaluation with AND/OR support
  const evaluateComplexCondition = (condition: string): boolean => {
    try {
      console.log(`🔍 Parsing complex condition: ${condition}`);

      // Handle AND conditions (&&)
      if (condition.includes('&&')) {
        const andParts = condition.split('&&').map(part => part.trim());
        console.log(`🔗 AND condition parts:`, andParts);

        for (const part of andParts) {
          if (!evaluateSimpleCondition(part)) {
            console.log(`❌ AND condition failed at: ${part}`);
            return false;
          }
        }
        console.log(`✅ All AND conditions passed`);
        return true;
      }

      // Handle OR conditions (||)
      if (condition.includes('||')) {
        const orParts = condition.split('||').map(part => part.trim());
        console.log(`🔗 OR condition parts:`, orParts);

        for (const part of orParts) {
          if (evaluateSimpleCondition(part)) {
            console.log(`✅ OR condition passed at: ${part}`);
            return true;
          }
        }
        console.log(`❌ All OR conditions failed`);
        return false;
      }

      // Single condition - use simple evaluation
      return evaluateSimpleCondition(condition);

    } catch (error) {
      console.error(`❌ Error evaluating complex condition: ${condition}`, error);
      return false;
    }
  };

  // Phase 5: Enhanced simple condition evaluation with more operators
  const evaluateSimpleCondition = (condition: string): boolean => {
    try {
      console.log(`🔍 Evaluating simple condition: ${condition}`);

      // Handle equality (==)
      const equalityMatch = condition.match(/^(.+?)==(.+?)$/);
      if (equalityMatch) {
        const [, leftSide, rightSide] = equalityMatch;
        return evaluateComparison(leftSide.trim(), rightSide.trim(), '==');
      }

      // Handle inequality (!=)
      const inequalityMatch = condition.match(/^(.+?)!=(.+?)$/);
      if (inequalityMatch) {
        const [, leftSide, rightSide] = inequalityMatch;
        return evaluateComparison(leftSide.trim(), rightSide.trim(), '!=');
      }

      // Handle greater than (>)
      const greaterMatch = condition.match(/^(.+?)>(.+?)$/);
      if (greaterMatch) {
        const [, leftSide, rightSide] = greaterMatch;
        return evaluateComparison(leftSide.trim(), rightSide.trim(), '>');
      }

      // Handle less than (<)
      const lessMatch = condition.match(/^(.+?)<(.+?)$/);
      if (lessMatch) {
        const [, leftSide, rightSide] = lessMatch;
        return evaluateComparison(leftSide.trim(), rightSide.trim(), '<');
      }

      // Handle greater than or equal (>=)
      const greaterEqualMatch = condition.match(/^(.+?)>=(.+?)$/);
      if (greaterEqualMatch) {
        const [, leftSide, rightSide] = greaterEqualMatch;
        return evaluateComparison(leftSide.trim(), rightSide.trim(), '>=');
      }

      // Handle less than or equal (<=)
      const lessEqualMatch = condition.match(/^(.+?)<=(.+?)$/);
      if (lessEqualMatch) {
        const [, leftSide, rightSide] = lessEqualMatch;
        return evaluateComparison(leftSide.trim(), rightSide.trim(), '<=');
      }

      // Handle boolean variable (just variable name)
      const booleanMatch = condition.match(/^([a-zA-Z_][a-zA-Z0-9_.]*?)$/);
      if (booleanMatch) {
        const variablePath = booleanMatch[1].trim();
        const value = getVariableByPath(variablePath);
        console.log(`🔍 Boolean variable check: ${variablePath} = ${value}`);
        return !!value; // Convert to boolean
      }

      console.log(`⚠️ Unrecognized condition format: ${condition}`);
      return false;

    } catch (error) {
      console.error(`❌ Error evaluating simple condition: ${condition}`, error);
      return false;
    }
  };

  // Phase 5: Enhanced comparison evaluation with type handling
  const evaluateComparison = (leftSide: string, rightSide: string, operator: string): boolean => {
    const leftValue = getVariableByPath(leftSide);
    const rightValue = parseValue(rightSide);

    console.log(`🔍 Comparison: ${leftSide} (${leftValue}) ${operator} ${rightSide} (${rightValue})`);

    switch (operator) {
      case '==':
        return leftValue === rightValue;
      case '!=':
        return leftValue !== rightValue;
      case '>':
        return Number(leftValue) > Number(rightValue);
      case '<':
        return Number(leftValue) < Number(rightValue);
      case '>=':
        return Number(leftValue) >= Number(rightValue);
      case '<=':
        return Number(leftValue) <= Number(rightValue);
      default:
        console.log(`⚠️ Unknown operator: ${operator}`);
        return false;
    }
  };

  // Phase 5: Enhanced value parsing with type detection
  const parseValue = (value: string): any => {
    let trimmed = value.trim();

    // Remove trailing semicolon if present (Articy conditions end with semicolons)
    if (trimmed.endsWith(';')) {
      trimmed = trimmed.slice(0, -1).trim();
    }

    // Remove quotes if present
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // Boolean values
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    // Numeric values
    if (!isNaN(Number(trimmed))) return Number(trimmed);

    // Check if it's a variable path
    if (trimmed.includes('.')) {
      const variableValue = getVariableByPath(trimmed);
      if (variableValue !== undefined) {
        return variableValue;
      }
    }

    // Return as string
    return trimmed;
  };

  // Phase 5: Enhanced variable path resolution with better error handling
  const getVariableByPath = (path: string): any => {
    if (!path || !variables) {
      console.log(`⚠️ Invalid path or no variables: ${path}`);
      return undefined;
    }

    const parts = path.split('.');
    if (parts.length < 2) {
      console.log(`⚠️ Invalid variable path format (needs namespace.variable): ${path}`);
      return undefined;
    }

    // Handle nested paths (namespace.subnamespace.variable)
    const namespace = parts[0];
    const variablePath = parts.slice(1);

    console.log(`🔍 Looking for variable: ${namespace} -> ${variablePath.join('.')}`);

    // Check exact match first
    if (variables[namespace]) {
      let current = variables[namespace];
      for (const part of variablePath) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = undefined;
          break;
        }
      }
      if (current !== undefined) {
        console.log(`✅ Found exact match: ${path} = ${current}`);
        return current;
      }
    }

    // Check case-insensitive match
    for (const ns in variables) {
      if (ns.toLowerCase() === namespace.toLowerCase()) {
        let current = variables[ns];
        let found = true;

        for (const part of variablePath) {
          if (current && typeof current === 'object') {
            // Look for case-insensitive match
            let foundPart = false;
            for (const key in current) {
              if (key.toLowerCase() === part.toLowerCase()) {
                current = current[key];
                foundPart = true;
                break;
              }
            }
            if (!foundPart) {
              found = false;
              break;
            }
          } else {
            found = false;
            break;
          }
        }

        if (found && current !== undefined) {
          console.log(`✅ Found case-insensitive match: ${path} = ${current}`);
          return current;
        }
      }
    }

    console.log(`⚠️ Variable not found: ${path}`);
    return undefined;
  };

  const layout = layoutData as LayoutRoot;

  // Simple 30% scale
  const scale = 0.30;

  // Function to check if an element should be visible
  const isElementVisible = (elementName: string): boolean => {
    // Always show background
    if (elementName === 'bg') {
      return true;
    }

    // Phase 6: Handle update indicators
    if (elementName.toLowerCase().includes('_update')) {
      const baseEvidenceName = elementName.replace(/_update$/i, '');
      const shouldShowUpdate = updateIndicators[baseEvidenceName];
      console.log(`🔔 Update indicator for ${baseEvidenceName}: ${shouldShowUpdate}`);
      return shouldShowUpdate || false;
    }

    // For all other elements, check for corresponding "_found" variable
    const foundVariableName = `${elementName}_found`;

    // Look through all variable namespaces for the found variable
    if (variables) {
      // Check in all possible variable namespaces
      for (const namespace in variables) {
        const namespaceVars = variables[namespace];
        if (namespaceVars) {
          // Check for exact match first
          if (namespaceVars[foundVariableName] === true) {
            console.log(`🔍 Found evidence: ${elementName} (${foundVariableName} = true)`);
            return true;
          }

          // Check for case-insensitive match
          for (const varName in namespaceVars) {
            if (varName.toLowerCase() === foundVariableName.toLowerCase() && namespaceVars[varName] === true) {
              console.log(`🔍 Found evidence (case-insensitive): ${elementName} (${varName} = true, looking for ${foundVariableName})`);
              return true;
            }
          }
        }
      }
    }

    // Default to hidden if variable not found or false
    console.log(`🔒 Hidden evidence: ${elementName} (${foundVariableName} not found or false)`);
    return false;
  };

  // Check if an element is evidence (not an update indicator or background)
  const isEvidenceImage = (elementName: string): boolean => {
    // Evidence images don't end with _update and aren't background elements
    return !elementName.toLowerCase().includes('_update') &&
           !elementName.toLowerCase().includes('background') &&
           !elementName.toLowerCase().includes('bg');
  };

  console.log('🎨 Murderboard rendering with variables:', {
    originalWidth: layout.size.width,
    originalHeight: layout.size.height,
    scale: scale,
    variablesAvailable: !!variables,
    variableNamespaces: variables ? Object.keys(variables) : []
  });

  return (
    <div
      style={{
        position: 'relative',
        width: layout.size.width * scale,
        height: layout.size.height * scale,
        overflow: 'hidden',
        border: '2px solid red' // Debug border
      }}
    >
        {layout.children.map((element, index) => {
          const fileName = `${element.relativePath}.${element.type}`;
          const imagePath = getAssetUrl(fileName);
          const isVisible = isElementVisible(element.name);

          // Reverse z-index so background (last element) has lowest z-index
          const zIndex = layout.children.length - 1 - index;

          console.log(`🖼️ Processing image: ${fileName} (visible: ${isVisible}, z-index: ${zIndex})`);

          const isEvidence = isEvidenceImage(element.name);

          console.log(`🎯 Image render debug: ${element.name}`, {
            isEvidence,
            isVisible,
            canClick: isEvidence && isVisible,
            cursor: isEvidence && isVisible ? 'pointer' : 'default'
          });

          return (
            <img
              key={index}
              src={imagePath}
              alt={element.name}
              style={{
                position: 'absolute',
                left: element.offset.left * scale,
                top: element.offset.top * scale,
                width: element.size.width * scale,
                height: element.size.height * scale,
                objectFit: 'contain',
                zIndex: zIndex, // Reversed z-order so background is at bottom
                border: '1px solid rgba(255,255,255,0.2)', // Debug border
                display: isVisible ? 'block' : 'none', // Hide/show based on variables
                cursor: isEvidence && isVisible ? 'pointer' : 'default', // Show pointer for clickable evidence
                transition: 'transform 0.2s ease, filter 0.2s ease'
              }}
              onClick={() => {
                console.log(`🖱️ Image clicked: ${element.name}`, { isEvidence, isVisible });
                if (isEvidence && isVisible) {
                  handleEvidenceClick(element.name);
                } else {
                  console.log(`❌ Click ignored: isEvidence=${isEvidence}, isVisible=${isVisible}`);
                }
              }}
              onMouseEnter={(e) => {
                if (isEvidence && isVisible) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (isEvidence && isVisible) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }
              }}
              onLoad={() => {
                console.log(`✅ Successfully loaded: ${fileName} (visible: ${isVisible}, clickable: ${isEvidence})`);
              }}
              onError={(e) => {
                console.warn(`❌ Failed to load image: ${fileName} from ${imagePath}`);
                // Show a placeholder instead of hiding
                e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.3)';
                e.currentTarget.style.border = '2px solid red';
              }}
            />
          );
        })}

      {/* Evidence Popup */}
      <EvidencePopup
        isVisible={evidencePopup.isVisible}
        onClose={closeEvidencePopup}
        evidenceName={evidencePopup.evidenceName}
        content={evidencePopup.content}
      />
    </div>
  );
};

export class MysteryworksMurderboardPlugin implements IPlugin {
  metadata: PluginMetadata = {
    id: 'mysteryworks-murderboard',
    name: 'Mysteryworks Murderboard',
    description: 'Interactive murder mystery investigation board for tracking suspects, evidence, and connections',
    version: '1.0.0',
    author: 'Mysteryworks',
    icon: 'file-search',
    enabled: true
  };

  private context?: PluginContext;
  private currentVariables?: any;

  /**
   * Enable isolated rendering to prevent infinite re-render loops
   * on multiple choice nodes
   */
  useIsolatedRendering(): boolean {
    return true;
  }

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.currentVariables = context.variables;
    console.log('🔍 Mysteryworks Murderboard Plugin initialized');
    console.log('🔍 Initial context:', {
      hasProject: !!context.project,
      projectType: typeof context.project,
      hasVariables: !!context.variables,
      hasCurrentNode: !!context.currentNode
    });

    // Show a welcome message when plugin is loaded
    context.showMessage('Mysteryworks Murderboard plugin loaded!', 'success');

    // Subscribe to dataset load events
    context.onEvent('dataset-loaded', this.onDatasetLoad.bind(this));

    // Subscribe to context update events
    context.onEvent('context-updated', this.onContextUpdate.bind(this));

    // Log initial variable state for debugging
    console.log('🔍 Initial variables:', this.currentVariables);
  }

  async destroy(): Promise<void> {
    console.log('🔍 Mysteryworks Murderboard Plugin destroyed');
    this.context = undefined;
  }

  getButtonConfig(): PluginButtonConfig {
    return {
      text: 'Murderboard',
      icon: <FileSearchOutlined />,
      position: 2
    };
  }

  renderModal(props: PluginModalProps): React.ReactNode {
    // Calculate exact modal size based on content - no padding needed
    const layout = layoutData as LayoutRoot;
    const scale = 0.30; // Match the scale in the component
    const contentWidth = layout.size.width * scale;
    const contentHeight = layout.size.height * scale;

    // Log current variables when modal is rendered
    console.log('🎨 Rendering murderboard modal with variables:', this.currentVariables);

    return (
      <Modal
        title={props.title || this.metadata.name}
        open={props.isVisible}
        onCancel={props.onClose}
        footer={null}
        width={contentWidth + 48}
        zIndex={9999}
        style={{ top: 20 }}
        bodyStyle={{
          height: contentHeight,
          padding: '0px',
          backgroundColor: '#000'
        }}
      >
        <MurderboardCanvasWithResize
          variables={this.currentVariables}
          project={this.getCurrentProject()}
        />

        {/* Debug: Show context info */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            maxWidth: '300px',
            zIndex: 10001,
            maxWidth: '300px'
          }}>
            <div>Context Available: {!!this.context ? 'Yes' : 'No'}</div>
            <div>Project Available: {!!this.context?.project ? 'Yes' : 'No'}</div>
            <div>Project Type: {typeof this.context?.project}</div>
            <div>Project Keys: {this.context?.project ? Object.keys(this.context.project).slice(0, 5).join(', ') : 'None'}</div>
            <div>Context Keys: {this.context ? Object.keys(this.context).join(', ') : 'None'}</div>
            <div>Variables Available: {!!this.context?.variables ? 'Yes' : 'No'}</div>
            <div>Current Node: {!!this.context?.currentNode ? 'Yes' : 'No'}</div>
          </div>
        )}
      </Modal>
    );
  }

  // Optional event handlers
  onDatasetLoad(data: any): void {
    console.log('🔍 Mysteryworks Murderboard Plugin: Dataset loaded', data);
    if (this.context) {
      this.context.showMessage('Mysteryworks Murderboard plugin detected dataset load!', 'info');
      // Update context with project data
      this.context.project = data;
    }
  }

  onNodeChange(node: any): void {
    console.log('🔍 Mysteryworks Murderboard Plugin: Node changed', node);
    // Update context with new node data
    if (this.context) {
      this.context.currentNode = node;
    }
  }

  onContextUpdate(contextUpdate: any): void {
    console.log('🔍 Mysteryworks Murderboard Plugin: Context updated', {
      hasProject: !!contextUpdate.project,
      projectType: typeof contextUpdate.project,
      hasVariables: !!contextUpdate.variables,
      hasCurrentNode: !!contextUpdate.currentNode
    });

    // Update our context with the new data
    if (this.context) {
      this.context = { ...this.context, ...contextUpdate };
      this.currentVariables = this.context.variables;

      // Force a re-render if we got project data
      if (contextUpdate.project) {
        console.log('🎉 Project data received! Forcing re-render...');
        // The plugin system should handle re-rendering automatically
      }
    }
  }

  onVariableChange(variables: any): void {
    console.log('🔍 Mysteryworks Murderboard Plugin: Variables changed', variables);
    this.currentVariables = variables;
    // Update context with new variables
    if (this.context) {
      this.context.variables = variables;
    }

    // Log any "_found" variables for debugging
    if (variables) {
      const foundVariables: any = {};
      for (const namespace in variables) {
        const namespaceVars = variables[namespace];
        if (namespaceVars) {
          for (const varName in namespaceVars) {
            if (varName.toLowerCase().endsWith('_found') && namespaceVars[varName] === true) {
              foundVariables[`${namespace}.${varName}`] = namespaceVars[varName];
            }
          }
        }
      }

      if (Object.keys(foundVariables).length > 0) {
        console.log('🔍 Found evidence variables (case-insensitive):', foundVariables);
      }
    }
  }

  /**
   * Get the current project data, trying multiple sources
   */
  private getCurrentProject(): any {
    console.log('🔍 getCurrentProject called');
    console.log('🔍 Context available:', !!this.context);
    console.log('🔍 Context project available:', !!this.context?.project);
    console.log('🔍 Context project type:', typeof this.context?.project);

    // Try to get from current context first
    if (this.context?.project) {
      console.log('✅ Got project from plugin context');
      return this.context.project;
    }

    // Try to get from global window object as a fallback
    // This is a temporary workaround until we fix the context update mechanism
    if (typeof window !== 'undefined' && (window as any).articyProject) {
      console.log('✅ Got project from global window object');
      return (window as any).articyProject;
    }

    console.log('⚠️ No project data available from any source');
    return undefined;
  }
}

// Export plugin instance
export const mysteryworksMurderboardPlugin = new MysteryworksMurderboardPlugin();
