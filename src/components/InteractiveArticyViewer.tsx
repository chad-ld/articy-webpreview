import React, { useState, useEffect, useCallback, useRef, createRef } from 'react';
import { Button, message } from 'antd';
import { InboxOutlined, CommentOutlined } from '@ant-design/icons';
import ArticyProject from '../utils/ArticyProject';
import InstructionPanel from '../panels/InstructionPanel';
import EndOfFlowPanel from '../panels/EndOfFlowPanel';
import QuestionPanel from '../panels/QuestionPanel';
import VariablesPanel from './VariablesPanel';
import SearchNodesPanel from './SearchNodesPanel';
import ConditionBubble from './ConditionBubble';
import TextBlock from './TextBlock';

interface InteractiveArticyViewerProps {
  data: any;
  onReset: () => void;
  onPanelWidthChange?: (width: number) => void;
  onLoadScreen?: () => void;
}

interface ChoiceOption {
  text: string;
  targetNode: any;
  disabled?: boolean;
  condition?: string;
}

interface PreviousChoice {
  node: any;
  choiceText: string;
  choiceTitle?: string;
  color?: { r: number; g: number; b: number };
  nodeList: any[];
  variables: any;
  fromMultiChoice: boolean;
}

// Component for displaying previous choice
function PreviousChoiceDisplay({ previousChoice, onBack, selected = false }: {
  previousChoice: PreviousChoice,
  onBack: () => void,
  selected?: boolean
}) {
  // Convert Articy color (0.0-1.0) to CSS RGB (0-255) and create darker background
  const getColors = () => {
    if (previousChoice.color) {
      const r = Math.round(previousChoice.color.r * 255);
      const g = Math.round(previousChoice.color.g * 255);
      const b = Math.round(previousChoice.color.b * 255);

      // Frame/border color (original color but greyed out)
      const frameColor = `rgba(${r}, ${g}, ${b}, 0.5)`;

      // Background color (50% darker version with reduced opacity)
      const darkR = Math.round(r * 0.5);
      const darkG = Math.round(g * 0.5);
      const darkB = Math.round(b * 0.5);
      const backgroundColor = `rgba(${darkR}, ${darkG}, ${darkB}, 0.5)`;

      // Calculate relative luminance to determine text color
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const headerTextColor = luminance > 0.5 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';

      return { frameColor, backgroundColor, headerTextColor };
    }

    // Default colors (greyed out)
    return {
      frameColor: 'rgba(147, 193, 204, 0.5)',
      backgroundColor: 'rgba(90, 102, 104, 0.5)',
      headerTextColor: 'rgba(0, 0, 0, 0.5)'
    };
  };

  const { frameColor, backgroundColor, headerTextColor } = getColors();

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{
        color: '#999',
        fontSize: '16px',
        marginBottom: '10px',
        fontWeight: 'normal'
      }}>
        Previous Choice
      </h3>
      <div className="node" style={{
        opacity: 0.6,
        filter: 'grayscale(30%)',
        // Apply golden selection style to entire node container
        boxShadow: selected ? '0 0 0 3px rgba(255, 193, 7, 0.6)' : 'none',
        borderRadius: '4px'
      }}>
        {previousChoice.choiceTitle && (
          <div
            className="articy-node-header"
            style={{
              backgroundColor: frameColor,
              borderColor: frameColor,
              color: headerTextColor
            }}
          >
            {/* The choiceTitle already contains the speaker name with icon for dialogue fragments */}
            {previousChoice.choiceTitle}
          </div>
        )}
        <TextBlock borderColor={frameColor} backgroundColor={backgroundColor}>
          {previousChoice.choiceText}
        </TextBlock>
      </div>
      {/* Back button outside the faded node - left aligned, full opacity */}
      <div style={{ marginTop: '10px', textAlign: 'left' }}>
        <Button onClick={onBack}>
          ← Back
        </Button>
      </div>
    </div>
  );
}

const InteractiveArticyViewer: React.FC<InteractiveArticyViewerProps> = ({ data, onReset, onPanelWidthChange, onLoadScreen }) => {
  const [project, setProject] = useState<ArticyProject | undefined>(undefined);
  const [currentNode, setCurrentNode] = useState<any>(null);
  const [nodeHistory, setNodeHistory] = useState<any[]>([]);
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOption[]>([]);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);
  const [showingChoices, setShowingChoices] = useState(false);
  const [showConditionChoices, setShowConditionChoices] = useState(false);

  // Panel state management
  const [variablesPanelWidth, setVariablesPanelWidth] = useState(0);
  const [searchPanelWidth, setSearchPanelWidth] = useState(0);
  const [isVariablesPanelVisible, setIsVariablesPanelVisible] = useState(false);
  const [isSearchPanelVisible, setIsSearchPanelVisible] = useState(false);

  // Story only mode state
  const [storyOnlyMode, setStoryOnlyMode] = useState(false);

  // Story mode filter settings
  const [storyModeSettings, setStoryModeSettings] = useState({
    enabled: false,
    hideInstructions: false,
    hideConditions: false,
    hideInactiveChoices: true
  });

  // Temporary settings for dropdown (before applying)
  const [tempStoryModeSettings, setTempStoryModeSettings] = useState({
    hideInstructions: false,
    hideConditions: false,
    hideInactiveChoices: true
  });

  // Previous choice history for back navigation
  const [previousChoiceHistory, setPreviousChoiceHistory] = useState<PreviousChoice[]>([]);
  const [showPrevious, setShowPrevious] = useState(true);

  // Refs for condition bubble positioning
  const nodeRefs = useRef<(React.RefObject<HTMLDivElement>)[]>([]);
  // State to force re-render when refs are ready
  const [bubbleRenderKey, setBubbleRenderKey] = useState(0);

  // Helper function to get speaker name with icon for display
  const getSpeakerNameWithIcon = (node: any) => {
    if (node.Properties.Speaker) {
      const speakerNode = project?.GetNodeByID(node.Properties.Speaker);
      if (speakerNode) {
        return (
          <span>
            <CommentOutlined style={{ marginRight: '6px' }} />
            {speakerNode.Properties.DisplayName}
          </span>
        );
      }
    }
    return null;
  };

  // Helper function to get speaker name as string (without JSX)
  const getSpeakerNameString = (node: any): string => {
    if (node.Properties.Speaker) {
      const speakerNode = project?.GetNodeByID(node.Properties.Speaker);
      if (speakerNode) {
        return speakerNode.Properties.DisplayName;
      }
    }
    return node.Properties.DisplayName || '';
  };

  // Custom navigation function that handles Jump nodes automatically and story only mode
  const navigateToNode = (node: any) => {
    if (!node) return;

    // Handle Jump nodes immediately - redirect to target
    if (node.Type === "Jump" && node.Properties.Target) {
      const targetNode = project?.GetNodeByID(node.Properties.Target);
      if (targetNode) {
        console.log("🔄 JUMP REDIRECT:", node.Properties.Id, "→", targetNode.Properties.Id);
        // Recursively call navigateToNode with the target
        navigateToNode(targetNode);
        return;
      } else {
        console.warn("⚠️ Jump node target not found:", node.Properties.Target);
      }
    }

    // Handle story only mode - skip nodes that shouldn't be displayed
    if (storyModeSettings.enabled && !shouldDisplayNodeInStoryMode(node)) {
      console.log("📖 STORY MODE: Skipping node", node.Type, node.Properties.Id);

      // Process the node behind the scenes (store variables, etc.)
      // NOTE: Condition nodes are excluded - they should only evaluate conditions, not modify variables
      if (project && node.Type !== "Condition") {
        project.StoreVariablesFromNode(node);
      }

      // Get outputs and automatically navigate to the next appropriate node
      const outputs: ChoiceOption[] = [];

      // Special handling for Condition nodes in story mode
      if (node.Type === "Condition") {
        // For condition nodes, evaluate the condition and navigate to the appropriate output
        const expression = node.Properties.Expression || "";
        const lines = expression.split('\n');
        const conditionLine = lines.find((line: string) => line.trim() && !line.trim().startsWith('//'));
        const conditionResult = conditionLine ? project.CheckConditionString(conditionLine.trim()) : false;

        console.log("📖 STORY MODE: Condition node evaluation:", {
          nodeId: node.Properties.Id,
          conditionLine: conditionLine,
          conditionResult: conditionResult
        });

        // Navigate to the appropriate output pin based on condition result
        if (node.Properties.OutputPins) {
          node.Properties.OutputPins.forEach((outputPin: any, pinIndex: number) => {
            if (outputPin.Connections && outputPin.Connections.length > 0) {
              // For condition nodes: first pin (index 0) is for true, second pin (index 1) is for false
              const shouldTakeThisPin = pinIndex === 0 ? conditionResult : !conditionResult;

              if (shouldTakeThisPin) {
                outputPin.Connections.forEach((connection: any) => {
                  const targetNode = project?.GetNodeByID(connection.Target);
                  if (targetNode) {
                    outputs.push({
                      text: "",
                      targetNode: targetNode,
                      disabled: false,
                      condition: conditionLine || ""
                    });
                  }
                });
              }
            }
          });
        }
      } else {
        // Normal handling for non-condition nodes
        if (node.Properties.OutputPins) {
          node.Properties.OutputPins.forEach((outputPin: any) => {
            if (outputPin.Connections && outputPin.Connections.length > 0) {
              outputPin.Connections.forEach((connection: any) => {
                const targetNode = project?.GetNodeByID(connection.Target);
                if (targetNode) {
                  // Check conditions for this output
                  const conditionText = targetNode?.Properties?.InputPins?.[0]?.Text?.replace(/;+$/, '').trim() || "";
                  const conditionMet = conditionText === "" ? true : project.CheckConditionString(conditionText);

                  if (conditionMet) {
                    outputs.push({
                      text: "",
                      targetNode: targetNode,
                      disabled: false,
                      condition: conditionText
                    });
                  }
                }
              });
            }
          });
        }
      }

      // Navigate to the first valid output
      if (outputs.length > 0) {
        navigateToNode(outputs[0].targetNode);
        return;
      } else {
        // No valid outputs, treat as end of flow
        const endNode = { Type: "EndOfFlow", Properties: {} };
        setCurrentNode(endNode);
        setShowConditionChoices(false);
        return;
      }
    }

    // For non-Jump nodes that should be displayed, set as current node normally
    setCurrentNode(node);
    setShowConditionChoices(false); // Reset condition choices state when navigating
  };

  // Initialize project when data is provided
  useEffect(() => {
    if (data) {
      try {
        console.log('🔄 InteractiveArticyViewer: Initializing ArticyProject with data:', {
          hasPackages: !!data.Packages,
          packageCount: data.Packages?.length || 0,
          totalModels: data.Packages?.reduce((sum: number, pkg: any) => sum + (pkg.Models?.length || 0), 0) || 0
        });

        const articyProject = new ArticyProject(data);
        setProject(articyProject);

        console.log('🔍 InteractiveArticyViewer: Calling GetStartNode()...');

        // Find and set the start node
        const startNode = articyProject.GetStartNode();

        console.log('🔍 InteractiveArticyViewer: GetStartNode() returned:', startNode ? {
          id: startNode.Properties.Id,
          type: startNode.Type,
          hasText: !!startNode.Properties.Text,
          hasExpression: !!startNode.Properties.Expression
        } : null);

        if (startNode) {
          navigateToNode(startNode);
          setNodeHistory([startNode]);
          console.log('✅ InteractiveArticyViewer: Start node set successfully');
        } else {
          console.warn('⚠️ InteractiveArticyViewer: No start node found (looking for HTMLPREVIEW marker)');
          message.warning('No start node found. Looking for a node with HTMLPREVIEW marker.');
        }
      } catch (error) {
        console.error('❌ InteractiveArticyViewer: Error creating ArticyProject:', error);
        message.error('Error processing Articy data');
      }
    }
  }, [data]);

  // Panel toggle functions
  const handleVariablesPanelToggle = () => {
    setIsVariablesPanelVisible(!isVariablesPanelVisible);
    if (isSearchPanelVisible) {
      setIsSearchPanelVisible(false);
    }
  };

  const handleSearchPanelToggle = () => {
    setIsSearchPanelVisible(!isSearchPanelVisible);
    if (isVariablesPanelVisible) {
      setIsVariablesPanelVisible(false);
    }
  };

  const handleStoryOnlyModeToggle = () => {
    const newEnabled = !storyModeSettings.enabled;
    setStoryModeSettings(prev => ({ ...prev, enabled: newEnabled }));
    setStoryOnlyMode(newEnabled);
    console.log('🔄 Story Only Mode toggled:', newEnabled);
  };

  const handleTempStoryModeSettingChange = (setting: keyof typeof tempStoryModeSettings, value: boolean) => {
    setTempStoryModeSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    console.log('🔄 Temp Story Mode Settings changed:', { ...tempStoryModeSettings, [setting]: value });
  };

  const handleStoryModeApply = () => {
    // Check if any filters are enabled
    const anyFiltersEnabled = tempStoryModeSettings.hideInstructions ||
                             tempStoryModeSettings.hideConditions ||
                             tempStoryModeSettings.hideInactiveChoices;

    const newSettings = {
      enabled: anyFiltersEnabled,
      hideInstructions: tempStoryModeSettings.hideInstructions,
      hideConditions: tempStoryModeSettings.hideConditions,
      hideInactiveChoices: tempStoryModeSettings.hideInactiveChoices
    };

    setStoryModeSettings(newSettings);
    setStoryOnlyMode(anyFiltersEnabled);
    console.log('🔄 Story Mode Settings applied:', newSettings);
  };

  const handleStoryModePreset = (preset: 'all' | 'none') => {
    if (preset === 'all') {
      setTempStoryModeSettings({
        hideInstructions: true,
        hideConditions: true,
        hideInactiveChoices: true
      });
      console.log('🔄 Story Mode: All filters preset selected');
    } else {
      setTempStoryModeSettings({
        hideInstructions: false,
        hideConditions: false,
        hideInactiveChoices: false
      });
      console.log('🔄 Story Mode: Show everything preset selected');
    }
  };

  // State to control dropdown visibility
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleDropdownOpenChange = (open: boolean) => {
    setDropdownOpen(open);
    if (open) {
      // When opening dropdown, sync temp settings with current settings
      setTempStoryModeSettings({
        hideInstructions: storyModeSettings.hideInstructions,
        hideConditions: storyModeSettings.hideConditions,
        hideInactiveChoices: storyModeSettings.hideInactiveChoices
      });
    }
  };

  const handleStoryModeApplyAndClose = () => {
    handleStoryModeApply();
    setDropdownOpen(false);
  };

  // Helper function to check if a node has multiple outputs (is a hub)
  const hasMultipleOutputs = (node: any): boolean => {
    if (!node?.Properties?.OutputPins) return false;

    let outputCount = 0;
    node.Properties.OutputPins.forEach((outputPin: any) => {
      if (outputPin.Connections && outputPin.Connections.length > 0) {
        outputCount += outputPin.Connections.length;
      }
    });

    return outputCount > 1;
  };

  // Helper function to check if a node type inherits from a specific class
  const nodeInheritsFromClass = (nodeType: string, className: string): boolean => {
    if (!project) {
      console.log('🚨 No project found');
      return false;
    }

    if (!project.objectDefinitions) {
      console.log('🚨 No object definitions found in project. Project keys:', Object.keys(project));
      return false;
    }

    console.log('🔍 Object definitions available:', {
      count: project.objectDefinitions.length,
      firstFew: project.objectDefinitions.slice(0, 3).map((def: any) => ({ Type: def.Type, Class: def.Class }))
    });

    const definition = project.objectDefinitions.find((def: any) => def.Type === nodeType);
    if (!definition) {
      console.log('🚨 No definition found for node type:', nodeType, 'Available types:', project.objectDefinitions.map((def: any) => def.Type).slice(0, 10));
      return false;
    }

    console.log('🔍 Checking inheritance for:', {
      nodeType,
      className,
      definitionClass: definition.Class,
      definitionInheritsFrom: definition.InheritsFrom
    });

    // Check direct class match
    if (definition.Class === className) {
      console.log('✅ Direct class match:', nodeType, 'is', className);
      return true;
    }

    // Check inheritance chain
    if (definition.InheritsFrom === className) {
      console.log('✅ Inheritance match:', nodeType, 'inherits from', className);
      return true;
    }

    console.log('❌ No match:', nodeType, 'does not inherit from', className);
    return false;
  };

  // Helper function to determine if a node should be displayed in story only mode
  const shouldDisplayNodeInStoryMode = (node: any): boolean => {
    if (!storyModeSettings.enabled) return true; // Always display when story mode is off

    // Always keep hub nodes that offer choices, even if they're instruction nodes
    // These represent important decision points in the narrative
    const isHubNode = hasMultipleOutputs(node);

    // Also keep DialogueIntActionTemplate nodes as they are special hub-like nodes
    const isSpecialHubNode = node.Type === "DialogueIntActionTemplate" || node.Type === "Hub";

    if (isHubNode || isSpecialHubNode) {
      console.log('📖 STORY MODE: Keeping hub node:', {
        nodeId: node.Properties.Id,
        nodeType: node.Type,
        displayName: node.Properties.DisplayName,
        isHubNode: isHubNode,
        isSpecialHubNode: isSpecialHubNode
      });
      return true; // Keep hub nodes that offer choices
    }

    // Filter based on specific settings using dynamic class checking
    if (storyModeSettings.hideInstructions && nodeInheritsFromClass(node.Type, "Instruction")) {
      console.log('📖 STORY MODE: Hiding instruction-based node:', {
        nodeType: node.Type,
        nodeId: node.Properties.Id
      });
      return false;
    }

    if (storyModeSettings.hideConditions && nodeInheritsFromClass(node.Type, "Condition")) {
      console.log('📖 STORY MODE: Hiding condition-based node:', {
        nodeType: node.Type,
        nodeId: node.Properties.Id
      });
      return false;
    }

    // Keep narrative-oriented nodes like dialogue fragments, locations, etc.
    return true;
  };

  // Handle navigation to a specific node from search
  const handleNavigateToNode = (nodeId: string) => {
    const targetNode = project?.GetNodeByID(nodeId);
    if (targetNode) {
      // Reset variables to initial state when jumping to a specific node
      if (project) {
        project.ResetVariablesToInitialState();
      }

      // Clear current flow and start fresh from the target node
      setNodeHistory([]);
      setPreviousChoiceHistory([]);
      setShowingChoices(false);
      setChoiceOptions([]);
      setTimeout(() => {
        navigateToNode(targetNode);
      }, 0);
    }
  };

  // Go back to previous choice
  const goBack = () => {
    if (previousChoiceHistory.length > 0) {
      const lastChoice = previousChoiceHistory[previousChoiceHistory.length - 1];

      console.log('🔙 GOING BACK TO PREVIOUS CHOICE:', {
        backToNodeId: lastChoice.node.Properties.Id,
        backToNodeType: lastChoice.node.Type,
        lastChoiceText: lastChoice.choiceText,
        lastChoiceTitle: lastChoice.choiceTitle,
        nodeListLength: lastChoice.nodeList.length,
        fromMultiChoice: lastChoice.fromMultiChoice,
        currentPreviousHistoryLength: previousChoiceHistory.length
      });

      // Restore variables state
      if (project && lastChoice.variables) {
        project.variables = { ...lastChoice.variables };
      }

      // Restore node list and current node
      setNodeHistory(lastChoice.nodeList);

      // Navigate to the choice-offering node
      navigateToNode(lastChoice.node);

      // Remove the last choice from history
      setPreviousChoiceHistory(previousChoiceHistory.slice(0, -1));

      // If this was from a multi-choice, we need to restore the choice state
      if (lastChoice.fromMultiChoice) {
        // Check if the restored node is a hub node (multiple outputs) or special hub type
        const isHubNode = hasMultipleOutputs(lastChoice.node);
        const isSpecialHubNode = lastChoice.node.Type === "DialogueIntActionTemplate" || lastChoice.node.Type === "Hub";

        if (isHubNode || isSpecialHubNode) {
          // For hub nodes, directly show choices without calling handleNext
          // Get outputs from the restored node
          const outputs: ChoiceOption[] = [];
          if (lastChoice.node.Properties.OutputPins) {
            lastChoice.node.Properties.OutputPins.forEach((outputPin: any) => {
              if (outputPin.Connections && outputPin.Connections.length > 0) {
                outputPin.Connections.forEach((connection: any) => {
                  const targetNode = project?.GetNodeByID(connection.Target);
                  if (targetNode) {
                    let choiceText = connection.Label ||
                                   targetNode.Properties.DisplayName ||
                                   targetNode.Properties.Text ||
                                   targetNode.Properties.Expression ||
                                   `Go to ${targetNode.Type}`;
                    choiceText = choiceText.replace(/^\/\//, '').trim();
                    if (choiceText.length > 100) {
                      choiceText = choiceText.substring(0, 100) + '...';
                    }

                    const conditionText = targetNode?.Properties?.InputPins?.[0]?.Text?.replace(/;+$/, '').trim() || "";
                    const conditionMet = conditionText === "" ? true : project.CheckConditionString(conditionText);

                    outputs.push({
                      text: choiceText,
                      targetNode: targetNode,
                      disabled: !conditionMet,
                      condition: conditionText
                    });
                  }
                });
              }
            });
          }

          console.log('🔙 Hub node restored - showing choices directly:', {
            nodeId: lastChoice.node.Properties.Id,
            nodeType: lastChoice.node.Type,
            isHubNode: isHubNode,
            isSpecialHubNode: isSpecialHubNode,
            outputCount: outputs.length
          });
          setChoiceOptions(outputs);
          setShowingChoices(true);
        } else {
          // For non-hub nodes, use the original handleNext approach
          setTimeout(() => {
            handleNext();
          }, 0);
        }
      } else {
        // Reset choice state for single choices
        setShowingChoices(false);
        setChoiceOptions([]);
      }

      console.log('🔙 Went back to previous choice');
    }
  };

  // Helper function to get condition text from target node's InputPins
  const getConditionText = useCallback((connection: any): string => {
    if (!project) return "";
    const targetNode = project.GetNodeByID(connection.Target);
    let conditionText = targetNode?.Properties?.InputPins?.[0]?.Text || "";

    // Debug: Always log to see what's happening
    console.log('🔍 GET CONDITION TEXT DEBUG:', {
      connectionTarget: connection.Target,
      targetNodeId: targetNode?.Properties?.Id,
      targetNodeType: targetNode?.Type,
      hasInputPins: !!targetNode?.Properties?.InputPins,
      inputPinsLength: targetNode?.Properties?.InputPins?.length || 0,
      inputPinsData: targetNode?.Properties?.InputPins,
      rawConditionText: targetNode?.Properties?.InputPins?.[0]?.Text || "",
      hasText: !!targetNode?.Properties?.InputPins?.[0]?.Text
    });

    // Clean up condition text - remove trailing semicolons and whitespace
    conditionText = conditionText.replace(/;+$/, '').trim();

    return conditionText;
  }, [project]);

  // Get all output connections from a node
  const getCurrentNodeOutputs = useCallback(() => {
    if (!currentNode || !currentNode.Properties.OutputPins) return [];

    const outputs: ChoiceOption[] = [];

    // Special handling for Condition nodes
    if (currentNode.Type === "Condition") {
      // Extract the condition expression (skip comment lines)
      const expression = currentNode.Properties.Expression || "";
      const lines = expression.split('\n');
      const conditionLine = lines.find((line: string) => line.trim() && !line.trim().startsWith('//'));
      const conditionResult = conditionLine ? project.CheckConditionString(conditionLine.trim()) : false;
      console.log("🔄 CONDITION EVALUATION FOR CHOICES:", conditionLine, "→", conditionResult);

      // For condition nodes, check each output pin and enable/disable based on condition result
      currentNode.Properties.OutputPins.forEach((outputPin: any, pinIndex: number) => {
        if (outputPin.Connections && outputPin.Connections.length > 0) {
          outputPin.Connections.forEach((connection: any) => {
            const targetNode = project?.GetNodeByID(connection.Target);
            if (targetNode) {
              // Get choice text from the target node or connection label
              let choiceText = connection.Label ||
                             targetNode.Properties.DisplayName ||
                             targetNode.Properties.Text ||
                             targetNode.Properties.Expression ||
                             `Go to ${targetNode.Type}`;

              // Clean up the text (remove comments, etc.)
              choiceText = choiceText.replace(/^\/\//, '').trim();
              if (choiceText.length > 100) {
                choiceText = choiceText.substring(0, 100) + '...';
              }

              // For condition nodes: first pin (index 0) is enabled when condition is true,
              // second pin (index 1) is enabled when condition is false
              const conditionMet = pinIndex === 0 ? conditionResult : !conditionResult;

              // Create condition text for bubbles - first pin shows condition as-is, second pin shows negated
              let conditionText = "";
              if (conditionLine) {
                if (pinIndex === 0) {
                  // First pin: show the condition as-is (for true case)
                  conditionText = conditionLine.trim();
                } else {
                  // Second pin: show the negated condition (for false case)
                  // Replace ==true with ==false, ==false with ==true
                  if (conditionLine.includes('==true')) {
                    conditionText = conditionLine.replace('==true', '==false').trim();
                  } else if (conditionLine.includes('==false')) {
                    conditionText = conditionLine.replace('==false', '==true').trim();
                  } else {
                    // For other conditions, just negate with !
                    conditionText = `!(${conditionLine.trim()})`;
                  }
                }
              }

              console.log('🔍 CONDITION NODE CHOICE:', {
                pinIndex: pinIndex,
                conditionResult: conditionResult,
                conditionMet: conditionMet,
                choiceText: choiceText,
                conditionLine: conditionLine,
                conditionText: conditionText
              });

              outputs.push({
                text: choiceText,
                targetNode: targetNode,
                disabled: !conditionMet,
                condition: conditionText
              });
            }
          });
        }
      });
    } else {
      // Normal handling for non-condition nodes
      // Check all output pins
      currentNode.Properties.OutputPins.forEach((outputPin: any) => {
        if (outputPin.Connections && outputPin.Connections.length > 0) {
          outputPin.Connections.forEach((connection: any) => {
            const targetNode = project?.GetNodeByID(connection.Target);
            if (targetNode) {
              // Get choice text from the target node or connection label
              let choiceText = connection.Label ||
                             targetNode.Properties.DisplayName ||
                             targetNode.Properties.Text ||
                             targetNode.Properties.Expression ||
                             `Go to ${targetNode.Type}`;

              // Clean up the text (remove comments, etc.)
              choiceText = choiceText.replace(/^\/\//, '').trim();
              if (choiceText.length > 100) {
                choiceText = choiceText.substring(0, 100) + '...';
              }

              // Get condition text and evaluate it
              const conditionText = getConditionText(connection);
              const conditionMet = conditionText === "" ? true : project.CheckConditionString(conditionText);

              // Only log when there's actually a condition to check
              if (conditionText) {
                // Get current variable values for debugging
                const variableValues = {};
                if (conditionText.includes('Quest001_waypoint01_completed')) {
                  variableValues['Quest001_waypoint01_completed'] = project.variables?.TestFlowVariables?.Quest001_waypoint01_completed;
                }
                if (conditionText.includes('Quest001_waypoint03_completed')) {
                  variableValues['Quest001_waypoint03_completed'] = project.variables?.TestFlowVariables?.Quest001_waypoint03_completed;
                }
                if (conditionText.includes('HasSword')) {
                  variableValues['HasSword'] = project.variables?.TestFlowVariables?.HasSword;
                }
                if (conditionText.includes('Quest001_waypoint02_visible')) {
                  variableValues['Quest001_waypoint02_visible'] = project.variables?.TestFlowVariables?.Quest001_waypoint02_visible;
                }
                if (conditionText.includes('Quest001_waypoint04_completed')) {
                  variableValues['Quest001_waypoint04_completed'] = project.variables?.TestFlowVariables?.Quest001_waypoint04_completed;
                }
                if (conditionText.includes('JerkyFist')) {
                  variableValues['JerkyFist'] = project.variables?.TestFlowVariables?.JerkyFist;
                }

                console.log('🔍 CONDITION CHECK:', {
                  targetNodeId: targetNode.Properties.Id,
                  conditionText: conditionText,
                  conditionTextLength: conditionText.length,
                  conditionTextTrimmed: conditionText.trim(),
                  conditionMet: conditionMet,
                  choiceText: choiceText,
                  currentVariableValues: variableValues
                });

                // Log all TestFlowVariables for debugging
                console.log('🔍 ALL TESTFLOWVARIABLES:', project.variables?.TestFlowVariables);
              }

              outputs.push({
                text: choiceText,
                targetNode: targetNode,
                disabled: !conditionMet,
                condition: conditionText
              });
            }
          });
        }
      });
    }

    return outputs;
  }, [currentNode, project, getConditionText]);

  // Handle Next button - enhanced navigation
  const handleNext = () => {
    if (!project || !currentNode) return;

    const outputs = getCurrentNodeOutputs();

    if (outputs.length === 0) {
      // End of flow - no outputs
      const endNode = { Type: "EndOfFlow", Properties: {} };
      navigateToNode(endNode);
      setShowingChoices(false);
    } else if (outputs.length === 1) {
      // Single output - only store as previous choice if this is a meaningful choice point
      const targetNode = outputs[0].targetNode;

      console.log('🔄 Single output navigation:', {
        fromNodeId: currentNode.Properties.Id,
        fromNodeType: currentNode.Type,
        toNodeId: targetNode.Properties.Id,
        toNodeType: targetNode.Type
      });

      // Store as previous choice for all single-output navigations to allow back navigation
      // This allows users to go back through linear progression as well as multi-choice selections
      const shouldStoreAsPreviousChoice = true;

      if (shouldStoreAsPreviousChoice) {
        // Store the current node as previous choice for single-path navigation
        const isDialogueFragment = currentNode.Type === "DialogueInteractiveFragmentTemplate" ||
                                  currentNode.Type === "DialogueExplorationFragmentTemplate" ||
                                  currentNode.Type === "DialogueFragment";

        const originalChoiceTitle = isDialogueFragment ?
          getSpeakerNameString(currentNode) :
          currentNode.Properties.DisplayName;

        // Get the actual node content for the previous choice display
        // Use the same logic as main display to ensure consistency
        let nodeText = 'No content';
        let choiceTitle = currentNode.Properties.DisplayName || undefined;

        // For dialogue fragments, use speaker name as title (same as Available Choices)
        if (isDialogueFragment) {
          const speakerTitle = getSpeakerNameWithIcon(currentNode);
          if (speakerTitle) {
            choiceTitle = speakerTitle;
          }
        }

        if (currentNode.Type === "Hub") {
          nodeText = ''; // Hub nodes have no body text, only title
          choiceTitle = currentNode.Properties.DisplayName || 'Hub';
        } else if (currentNode.Properties.Text && currentNode.Properties.Text.trim()) {
          nodeText = currentNode.Properties.Text;
        } else if (currentNode.Properties.Expression && currentNode.Properties.Expression.trim()) {
          nodeText = currentNode.Properties.Expression;
          // For instruction nodes, always show DisplayName as title even if Expression is used for text
          if (currentNode.Type === "Instruction") {
            choiceTitle = currentNode.Properties.DisplayName || undefined;
          }
        } else if (currentNode.Properties.DisplayName && currentNode.Properties.DisplayName.trim()) {
          nodeText = currentNode.Properties.DisplayName;
          choiceTitle = undefined; // Don't duplicate title and text
        }

        const previousChoice: PreviousChoice = {
          node: currentNode,
          choiceText: nodeText,
          choiceTitle: choiceTitle,
          color: currentNode.Properties.Color,
          nodeList: [...nodeHistory],
          variables: project ? { ...project.variables } : {},
          fromMultiChoice: false
        };

        console.log('📝 STORING PREVIOUS CHOICE (single output from multi-choice):', {
          nodeId: currentNode.Properties.Id,
          nodeType: currentNode.Type,
          choiceText: nodeText,
          choiceTitle: choiceTitle,
          nodeHistoryLength: nodeHistory.length,
          previousChoiceHistoryLength: previousChoiceHistory.length
        });

        setPreviousChoiceHistory([...previousChoiceHistory, previousChoice]);
      } else {
        console.log('🔄 SKIPPING previous choice storage (no current node):', {
          nodeId: currentNode?.Properties?.Id,
          nodeType: currentNode?.Type,
          reason: 'No current node to store'
        });
      }

      // Store variables from the current node before navigating
      if (project) {
        project.StoreVariablesFromNode(currentNode);
      }

      navigateToNode(targetNode);
      setNodeHistory([...nodeHistory, targetNode]);
      setShowingChoices(false);
      console.log('🔄 Navigated to:', targetNode.Properties.Id, targetNode.Type);
    } else {
      // Special handling for condition nodes - show choices after first Next click
      if (currentNode.Type === "Condition" && !showConditionChoices) {
        // First time clicking Next on condition node - now show choices
        setShowConditionChoices(true);
        setChoiceOptions(outputs);
        setSelectedChoiceIndex(0);
        setShowingChoices(true);
        console.log('🔀 Condition node - showing choices after Next click');
        return;
      }

      // Multiple outputs - store current node as previous choice before showing choices
      // BUT: Don't store DialogueIntActionTemplate nodes as previous choices since they show choices immediately
      // NOTE: Regular Hub nodes should now be stored as previous choices since they show content first
      // NOTE: Condition nodes should NOT be treated as hub-style nodes - they show content first, then choices
      const isSpecialHubNode = currentNode.Type === "DialogueIntActionTemplate" || currentNode.Type === "Hub";

      // Check if this is a dialogue fragment (needed for both hub and non-hub logic)
      const isDialogueFragment = currentNode.Type === "DialogueInteractiveFragmentTemplate" ||
                                currentNode.Type === "DialogueExplorationFragmentTemplate" ||
                                currentNode.Type === "DialogueFragment";

      if (!isSpecialHubNode) {
        const originalChoiceTitle = isDialogueFragment ?
          getSpeakerNameString(currentNode) :
          currentNode.Properties.DisplayName;

        // Get the actual node content for the previous choice display
        // Use the same logic as main display to ensure consistency
        let nodeText = 'No content';
        let choiceTitle = currentNode.Properties.DisplayName || undefined;

        // For dialogue fragments, use speaker name as title (same as Available Choices)
        if (isDialogueFragment) {
          const speakerTitle = getSpeakerNameWithIcon(currentNode);
          if (speakerTitle) {
            choiceTitle = speakerTitle;
          }
        }

        // Priority order for text content (same as main display logic):
        // 1. Text property (main content)
        // 2. Expression property (for instruction nodes)
        // 3. DisplayName as fallback
        if (currentNode.Type === "Hub") {
          nodeText = ''; // Hub nodes have no body text, only title
          choiceTitle = currentNode.Properties.DisplayName || 'Hub';
        } else if (currentNode.Properties.Text && currentNode.Properties.Text.trim()) {
          nodeText = currentNode.Properties.Text;
        } else if (currentNode.Properties.Expression && currentNode.Properties.Expression.trim()) {
          nodeText = currentNode.Properties.Expression;
          // For instruction nodes, always show DisplayName as title even if Expression is used for text
          if (currentNode.Type === "Instruction") {
            choiceTitle = currentNode.Properties.DisplayName || undefined;
          }
        } else if (currentNode.Properties.DisplayName && currentNode.Properties.DisplayName.trim()) {
          nodeText = currentNode.Properties.DisplayName;
          choiceTitle = undefined; // Don't duplicate title and text
        }

        // Store the current node as previous choice when transitioning to multiple choices
        const previousChoice: PreviousChoice = {
          node: currentNode,
          choiceText: nodeText, // Use actual node content instead of generic text
          choiceTitle: choiceTitle,
          color: currentNode.Properties.Color,
          nodeList: [...nodeHistory],
          variables: project ? { ...project.variables } : {},
          fromMultiChoice: false // This node itself is not from a multi-choice, but leads to one
        };
        console.log('📝 STORING PREVIOUS CHOICE (multiple outputs):', {
          nodeId: currentNode.Properties.Id,
          nodeType: currentNode.Type,
          choiceText: nodeText,
          choiceTitle: choiceTitle,
          nodeHistoryLength: nodeHistory.length,
          previousChoiceHistoryLength: previousChoiceHistory.length,
          outputCount: outputs.length
        });
        setPreviousChoiceHistory([...previousChoiceHistory, previousChoice]);
      } else {
        console.log('🔀 Special hub node - NOT storing as previous choice:', {
          nodeId: currentNode.Properties.Id,
          nodeType: currentNode.Type,
          isSpecialHubNode: isSpecialHubNode,
          outputCount: outputs.length
        });
      }

      if (isDialogueFragment && !showingChoices) {
        // For dialogue fragments, show choices after showing content
        setChoiceOptions(outputs);
        setSelectedChoiceIndex(0);
        setShowingChoices(true);
        console.log('🔀 Showing', outputs.length, 'dialogue choices');
      } else {
        // For Hub nodes and other multi-output nodes, show choices immediately
        console.log('🔀 Setting choice options:', outputs.map((opt, idx) => ({
          index: idx,
          text: opt.text,
          condition: opt.condition,
          disabled: opt.disabled
        })));
        setChoiceOptions(outputs);
        setSelectedChoiceIndex(0);
        setShowingChoices(true);
        console.log('🔀 Showing', outputs.length, 'choices');
      }
    }
  };

  // Handle choice selection
  const handleChoiceSelect = (choiceIndex: number) => {
    console.log('🖱️ MOUSE CLICK - handleChoiceSelect called:', {
      choiceIndex: choiceIndex,
      choiceOptionsLength: choiceOptions.length,
      choiceExists: !!choiceOptions[choiceIndex],
      choiceDisabled: choiceOptions[choiceIndex]?.disabled,
      storyOnlyMode: storyOnlyMode,
      targetNodeId: choiceOptions[choiceIndex]?.targetNode?.Properties?.Id,
      targetNodeType: choiceOptions[choiceIndex]?.targetNode?.Type
    });

    if (!choiceOptions[choiceIndex] || choiceOptions[choiceIndex].disabled) {
      console.log('🚫 EARLY RETURN - Choice not found or disabled');
      return;
    }

    const selectedChoice = choiceOptions[choiceIndex];
    const targetNode = selectedChoice.targetNode;

    // Check if we're going from multiple choice to single choice and should skip
    const isFromMultipleChoice = choiceOptions.length > 1;
    let finalTargetNode = targetNode;
    let skippedNode = null;

    if (isFromMultipleChoice) {
      // Check if target node has exactly one output (single choice) first
      const targetOutputs = [];
      if (targetNode.Properties.OutputPins) {
        targetNode.Properties.OutputPins.forEach((outputPin: any) => {
          if (outputPin.Connections && outputPin.Connections.length > 0) {
            outputPin.Connections.forEach((connection: any) => {
              const nextNode = project?.GetNodeByID(connection.Target);
              if (nextNode) {
                // Check conditions for this output
                const conditionText = nextNode?.Properties?.InputPins?.[0]?.Text?.replace(/;+$/, '').trim() || "";
                const conditionMet = conditionText === "" ? true : project.CheckConditionString(conditionText);

                if (conditionMet) {
                  targetOutputs.push({
                    text: connection.Label || nextNode.Properties.DisplayName || 'Next',
                    targetNode: nextNode,
                    disabled: false,
                    condition: conditionText
                  });
                }
              }
            });
          }
        });
      }

      // Don't skip certain node types that are meant to show choices or content
      // DialogueIntActionTemplate nodes are ALWAYS hub nodes and should never be skipped
      // Other dialogue nodes should only be prevented from skipping if they have multiple outputs
      const shouldNeverSkip = (
        targetNode.Type === "DialogueIntActionTemplate" ||  // Special hub nodes - ALWAYS show (never skip)
        targetNode.Type === "Hub" ||  // Articy hub nodes always show
        hasMultipleOutputs(targetNode) ||  // Any node with multiple outputs (hub nodes) - ALWAYS show
        (targetNode.Type === "DialogueExplorationFragmentTemplate" && targetOutputs.length > 1) ||  // Dialogue nodes with multiple choices
        (targetNode.Type === "DialogueInteractiveFragmentTemplate" && targetOutputs.length > 1) ||  // Dialogue nodes with multiple choices
        (targetNode.Type === "DialogueFragment" && targetOutputs.length > 1) ||  // Dialogue nodes with multiple choices
        targetNode.Type === "Condition"  // Condition nodes need to show their logic
      );

      if (!shouldNeverSkip) {
        // If target node has exactly one valid output, skip it
        if (targetOutputs.length === 1) {
          console.log('🔄 SKIP DETECTED: Multiple → Single choice, skipping intermediate node:', {
            fromNodeId: currentNode.Properties.Id,
            fromNodeType: currentNode.Type,
            skippingNodeId: targetNode.Properties.Id,
            skippingNodeType: targetNode.Type,
            finalTargetNodeId: targetOutputs[0].targetNode.Properties.Id,
            finalTargetNodeType: targetOutputs[0].targetNode.Type
          });

          skippedNode = targetNode;
          finalTargetNode = targetOutputs[0].targetNode;

          // Process the skipped node (store variables, etc.) but don't display it
          if (project) {
            project.StoreVariablesFromNode(skippedNode);
          }
        }
      } else {
        console.log('🔄 SKIP PREVENTION: Node type should never be skipped:', {
          nodeId: targetNode.Properties.Id,
          nodeType: targetNode.Type,
          reason: 'Hub or dialogue node that needs to show content/choices'
        });
      }
    }

    // Store previous choice if we have a current node
    if (currentNode) {
      // For choice selections, we need to store information for both:
      // 1. Display: what choice was selected (target node info)
      // 2. Navigation: where to go back to (current choice-offering node)
      const isTargetDialogueFragment = finalTargetNode.Type === "DialogueInteractiveFragmentTemplate" ||
                                      finalTargetNode.Type === "DialogueExplorationFragmentTemplate" ||
                                      finalTargetNode.Type === "DialogueFragment" ||
                                      finalTargetNode.Type === "DialogueIntActionTemplate";

      // For DialogueIntActionTemplate (hub nodes), use the actual node content, not the choice text
      let choiceTitle, choiceText;

      if (finalTargetNode.Type === "DialogueIntActionTemplate") {
        // For hub nodes, show the hub's actual content as the choice text
        choiceText = finalTargetNode.Properties.Text ||
                    finalTargetNode.Properties.Expression ||
                    finalTargetNode.Properties.DisplayName ||
                    selectedChoice.text;
        choiceTitle = getSpeakerNameWithIcon(finalTargetNode) || finalTargetNode.Properties.DisplayName;
      } else if (skippedNode) {
        // If we skipped a node, use the skipped node's content for display
        choiceText = skippedNode.Properties.Text ||
                    skippedNode.Properties.Expression ||
                    skippedNode.Properties.DisplayName ||
                    selectedChoice.text;
        choiceTitle = isTargetDialogueFragment ?
          getSpeakerNameWithIcon(finalTargetNode) :
          (skippedNode.Properties.DisplayName || finalTargetNode.Properties.DisplayName);
      } else {
        // For other nodes, use the actual target node content (same logic as main display)
        // This ensures previous choices show the same content as the main display
        if (finalTargetNode.Type === "Hub") {
          choiceText = ''; // Hub nodes have no body text, only title
          choiceTitle = finalTargetNode.Properties.DisplayName || 'Hub';
        } else if (finalTargetNode.Properties.Text && finalTargetNode.Properties.Text.trim()) {
          choiceText = finalTargetNode.Properties.Text;
          choiceTitle = isTargetDialogueFragment ?
            getSpeakerNameWithIcon(finalTargetNode) :
            finalTargetNode.Properties.DisplayName;
        } else if (finalTargetNode.Properties.Expression && finalTargetNode.Properties.Expression.trim()) {
          choiceText = finalTargetNode.Properties.Expression;
          // For instruction nodes, always show DisplayName as title even if Expression is used for text
          if (finalTargetNode.Type === "Instruction") {
            choiceTitle = finalTargetNode.Properties.DisplayName || undefined;
          } else if (isTargetDialogueFragment) {
            choiceTitle = getSpeakerNameWithIcon(finalTargetNode);
          }
        } else if (finalTargetNode.Properties.DisplayName && finalTargetNode.Properties.DisplayName.trim()) {
          choiceText = finalTargetNode.Properties.DisplayName;
          choiceTitle = undefined; // Don't duplicate title and text
        } else {
          // Fallback to original logic if no content found
          choiceText = selectedChoice.text;
          choiceTitle = isTargetDialogueFragment ?
            getSpeakerNameWithIcon(finalTargetNode) :
            finalTargetNode.Properties.DisplayName;
        }
      }

      const previousChoice: PreviousChoice = {
        node: currentNode, // Store the choice-offering node for navigation back
        choiceText: choiceText, // Display the selected choice text or target content
        choiceTitle: choiceTitle, // Display the target node title
        color: skippedNode ? skippedNode.Properties.Color : finalTargetNode.Properties.Color, // Use skipped node color if available, otherwise final target
        nodeList: [...nodeHistory],
        variables: project ? { ...project.variables } : {},
        fromMultiChoice: choiceOptions.length > 1
      };
      console.log('📝 STORING PREVIOUS CHOICE (choice select):', {
        backToNodeId: currentNode.Properties.Id, // Where we'll navigate back to
        backToNodeType: currentNode.Type,
        displayChoiceText: choiceText, // What will be displayed
        displayChoiceTitle: choiceTitle,
        targetNodeId: finalTargetNode.Properties.Id, // Where we're going now
        targetNodeType: finalTargetNode.Type,
        skippedNodeId: skippedNode?.Properties?.Id,
        skippedNodeType: skippedNode?.Type,
        nodeHistoryLength: nodeHistory.length,
        previousChoiceHistoryLength: previousChoiceHistory.length,
        fromMultiChoice: choiceOptions.length > 1
      });
      setPreviousChoiceHistory([...previousChoiceHistory, previousChoice]);
    }

    // Store variables from the current node before navigating
    if (project) {
      project.StoreVariablesFromNode(currentNode);
    }

    // Navigate to the final target (either original target or skipped-to node)
    navigateToNode(finalTargetNode);

    // Update node history - include skipped node if we skipped one
    const newNodeHistory = skippedNode ?
      [...nodeHistory, targetNode, finalTargetNode] :
      [...nodeHistory, finalTargetNode];
    setNodeHistory(newNodeHistory);

    setShowingChoices(false);
    setChoiceOptions([]);

    console.log('✅ Selected choice:', selectedChoice.text);
    console.log('🔄 Navigated to:', finalTargetNode.Properties.Id, finalTargetNode.Type);
    if (skippedNode) {
      console.log('⏭️ Skipped intermediate node:', skippedNode.Properties.Id, skippedNode.Type);
    }
  };

  // Handle restart
  const handleRestart = useCallback(() => {
    if (project) {
      project.ResetVariablesToInitialState();
      const startNode = project.GetStartNode();
      if (startNode) {
        navigateToNode(startNode);
        setNodeHistory([startNode]);
        setShowingChoices(false);
        setChoiceOptions([]);
        setSelectedChoiceIndex(0);
        setPreviousChoiceHistory([]);
      }
    }
  }, [project]);

  // Handle load screen - go back to file selection
  const handleLoadScreen = useCallback(() => {
    if (onLoadScreen) {
      onLoadScreen();
    }
  }, [onLoadScreen]);

  // Get current available choices for keyboard navigation (includes previous choice)
  const getCurrentAvailableChoices = useCallback(() => {
    let choices: any[] = [];

    // Add previous choice as first option if available and visible
    if (showPrevious && previousChoiceHistory.length > 0) {
      choices.push({
        isPreviousChoice: true,
        onClick: goBack
      });
    }

    // Add current choices
    if (showingChoices) {
      // Filter choices based on story only mode and preserve original indices
      const filteredChoicesWithIndices = choiceOptions
        .map((option, originalIndex) => ({ option, originalIndex }))
        .filter(({ option }) => {
          if (storyModeSettings.enabled && storyModeSettings.hideInactiveChoices && option.disabled) {
            return false;
          }
          return true;
        });

      // Add the filtered choices with their original indices preserved
      choices.push(...filteredChoicesWithIndices.map(({ option, originalIndex }) => ({
        ...option,
        originalIndex: originalIndex
      })));
    } else {
      // Single choice or Next button
      choices.push({ isSingleChoice: true, onClick: handleNext });
    }

    return choices;
  }, [showPrevious, previousChoiceHistory.length, showingChoices, choiceOptions, storyOnlyMode, goBack, handleNext]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle keyboard events when a project is loaded
    if (!project || !currentNode) return;

    const availableChoices = getCurrentAvailableChoices();

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        if (availableChoices.length > 1) {
          setSelectedChoiceIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : availableChoices.length - 1;
            console.log('🔼 Selected choice:', newIndex + 1, 'of', availableChoices.length);
            return newIndex;
          });
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (availableChoices.length > 1) {
          setSelectedChoiceIndex(prev => {
            const newIndex = prev < availableChoices.length - 1 ? prev + 1 : 0;
            console.log('🔽 Selected choice:', newIndex + 1, 'of', availableChoices.length);
            return newIndex;
          });
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (availableChoices.length === 0) return;

        console.log('⏎ Confirming choice:', selectedChoiceIndex + 1);
        const selectedChoice = availableChoices[selectedChoiceIndex];
        if (selectedChoice.isPreviousChoice) {
          goBack();
        } else if (selectedChoice.isSingleChoice) {
          handleNext();
        } else {
          // Get the selected choice and use its original index
          const adjustedIndex = showPrevious && previousChoiceHistory.length > 0 ?
            selectedChoiceIndex - 1 : selectedChoiceIndex;
          const selectedChoiceData = availableChoices[selectedChoiceIndex];

          // Use the original index if available, otherwise fall back to adjusted index
          const choiceIndex = selectedChoiceData.originalIndex !== undefined ?
            selectedChoiceData.originalIndex : adjustedIndex;
          handleChoiceSelect(choiceIndex);
        }
        break;
      case 'r':
        if (event.ctrlKey) {
          event.preventDefault();
          handleRestart();
        }
        break;
      case 'l':
        if (event.ctrlKey) {
          event.preventDefault();
          handleLoadScreen();
        }
        break;
      case 'Escape':
        event.preventDefault();
        console.log('⎋ Cancelling choice selection');
        setShowingChoices(false);
        setChoiceOptions([]);
        break;
    }
  }, [project, currentNode, getCurrentAvailableChoices, selectedChoiceIndex, showPrevious, previousChoiceHistory.length, goBack, handleNext, handleChoiceSelect, handleRestart, handleLoadScreen]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset selected choice index when node changes
  useEffect(() => {
    // Always start focus on first forward choice (skip previous choice if visible)
    const hasPreviousChoice = showPrevious && previousChoiceHistory.length > 0;
    setSelectedChoiceIndex(hasPreviousChoice ? 1 : 0);
  }, [currentNode, showPrevious, previousChoiceHistory.length]);

  // Initialize node refs when choice options change
  useEffect(() => {
    // Filter choices based on story only mode
    const filteredChoices = choiceOptions.filter((option) => {
      if (storyModeSettings.enabled && storyModeSettings.hideInactiveChoices && option.disabled) {
        return false;
      }
      return true;
    });

    nodeRefs.current = filteredChoices.map(() => createRef<HTMLDivElement>());
    console.log('🔍 NODE REFS INITIALIZED:', {
      choiceOptionsLength: choiceOptions.length,
      filteredChoicesLength: filteredChoices.length,
      nodeRefsLength: nodeRefs.current.length,
      storyModeSettings: storyModeSettings,
      choiceConditions: filteredChoices.map((opt, idx) => ({ index: idx, condition: opt.condition, hasCondition: !!opt.condition }))
    });

    // Reset bubble render key when choice options change
    setBubbleRenderKey(0);
  }, [choiceOptions, storyOnlyMode]);

  // Force re-render of condition bubbles after DOM is mounted
  useEffect(() => {
    if (choiceOptions.length > 0 && nodeRefs.current.length > 0 && bubbleRenderKey === 0) {
      // Use a delay to ensure DOM elements are mounted
      const timer = setTimeout(() => {
        console.log('🔍 FORCING BUBBLE RE-RENDER');
        setBubbleRenderKey(1); // Trigger re-render
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [choiceOptions, bubbleRenderKey]);

  // Handle Hub nodes that should show choices immediately
  useEffect(() => {
    if (!currentNode || !project) return;

    const outputs = getCurrentNodeOutputs();

    // DialogueIntActionTemplate nodes should act as hubs and show choices immediately
    // BUT: Regular Hub nodes should show their title first, then choices when Next is clicked
    // Note: LocationTemplate nodes should show their content first, not immediately show choices
    // Condition nodes should NOT be treated as hub-style nodes - they show content first, then choices
    const isSpecialHubNode = currentNode.Type === "DialogueIntActionTemplate";
    const isHubNode = hasMultipleOutputs(currentNode);

    const shouldShowChoicesImmediately = isSpecialHubNode &&
                                         outputs.length > 1 &&
                                         !showingChoices;

    if (shouldShowChoicesImmediately) {
      console.log('🔀 Special hub node detected - showing choices immediately:', {
        type: currentNode.Type,
        displayName: currentNode.Properties.DisplayName,
        isSpecialHubNode: isSpecialHubNode,
        isHubNode: isHubNode,
        outputCount: outputs.length,
        nodeId: currentNode.Properties.Id
      });
      console.log('🔀 Hub setting choice options:', outputs.map((opt, idx) => ({
        index: idx,
        text: opt.text,
        condition: opt.condition,
        disabled: opt.disabled
      })));
      setChoiceOptions(outputs);
      setShowingChoices(true);
    }
  }, [currentNode?.Properties?.Id, project, showingChoices]); // Trigger when node changes

  // Calculate total panel width for margin adjustment
  const totalPanelWidth = isVariablesPanelVisible ? variablesPanelWidth :
                         isSearchPanelVisible ? searchPanelWidth : 0;

  // Notify parent component of panel width changes
  useEffect(() => {
    if (onPanelWidthChange) {
      onPanelWidthChange(totalPanelWidth);
    }
  }, [totalPanelWidth, onPanelWidthChange]);



  // Show loading state if no project loaded yet
  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <InboxOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        <h3>Initializing Interactive Viewer...</h3>
        <p>Processing Articy data...</p>
      </div>
    );
  }

  // Render current node
  if (!currentNode) {
    return <div>No current node</div>;
  }

  // Handle end of flow
  if (currentNode.Type === "EndOfFlow") {
    return <EndOfFlowPanel onRestart={handleRestart} />;
  }

  // Calculate gradual margin - only start shifting when panel gets wide enough
  const calculateMarginLeft = (panelWidth: number) => {
    if (panelWidth === 0) return 'auto';

    // Buffer zone: no shifting until panel is wider than 320px
    const bufferThreshold = 320;
    if (panelWidth <= bufferThreshold) return 'auto';

    // Gradual shifting: start with minimal shift, increase gradually
    const excessWidth = panelWidth - bufferThreshold;
    const gradualShift = Math.min(excessWidth * 0.8, panelWidth); // 80% of excess width, capped at panel width
    return `${gradualShift + 40}px`; // Add 40px buffer between panel and content
  };

  // Get outputs for decision making
  const outputs = getCurrentNodeOutputs();

  // Show choices if we're in choice mode
  if (showingChoices && choiceOptions.length > 0) {
    const nodeText = currentNode.Properties.Text || currentNode.Properties.Expression || 'Available Choices';
    const nodeTitle = currentNode.Properties.DisplayName || undefined;

    return (
      <div>
        {/* Panels */}
        {project && (
          <>
            <VariablesPanel
              project={project}
              currentNode={currentNode}
              onWidthChange={setVariablesPanelWidth}
              showPrevious={showPrevious}
              onTogglePrevious={() => setShowPrevious(!showPrevious)}
              hasPreviousChoice={previousChoiceHistory.length > 0}
              isVisible={isVariablesPanelVisible}
              onToggleVisibility={handleVariablesPanelToggle}
              onToggleSearchPanel={handleSearchPanelToggle}
              isSearchPanelVisible={isSearchPanelVisible}
              storyOnlyMode={storyOnlyMode}
              storyModeSettings={storyModeSettings}
              tempStoryModeSettings={tempStoryModeSettings}
              onToggleStoryOnlyMode={handleStoryOnlyModeToggle}
              onTempStoryModeSettingChange={handleTempStoryModeSettingChange}
              onStoryModeApply={handleStoryModeApplyAndClose}
              onStoryModePreset={handleStoryModePreset}
              onDropdownOpenChange={handleDropdownOpenChange}
              dropdownOpen={dropdownOpen}
            />
            <SearchNodesPanel
              project={project}
              currentNode={currentNode}
              onWidthChange={setSearchPanelWidth}
              onNavigateToNode={handleNavigateToNode}
              isVisible={isSearchPanelVisible}
              onToggleVisibility={handleSearchPanelToggle}
              onToggleVariablesPanel={handleVariablesPanelToggle}
              isVariablesPanelVisible={isVariablesPanelVisible}
              storyOnlyMode={storyOnlyMode}
              storyModeSettings={storyModeSettings}
              tempStoryModeSettings={tempStoryModeSettings}
              onToggleStoryOnlyMode={handleStoryOnlyModeToggle}
              onTempStoryModeSettingChange={handleTempStoryModeSettingChange}
              onStoryModeApply={handleStoryModeApplyAndClose}
              onStoryModePreset={handleStoryModePreset}
              onDropdownOpenChange={handleDropdownOpenChange}
              dropdownOpen={dropdownOpen}
            />
          </>
        )}

        {/* Keyboard shortcuts helper - exactly like 3.x version */}
        {project && (
          <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000,
            fontFamily: 'monospace'
          }}>
            ↑↓ Navigate • Enter Select • Ctrl+R Restart • Ctrl+L Load
          </div>
        )}

        <div style={{
          padding: '5px 20px',
          maxWidth: '800px',
          margin: '0 auto',
          marginLeft: calculateMarginLeft(totalPanelWidth),
          transition: 'margin-left 0.3s ease'
        }}>
        {/* Previous choice display */}
        {showPrevious && previousChoiceHistory.length > 0 && (
          <>
            <PreviousChoiceDisplay
              previousChoice={previousChoiceHistory[previousChoiceHistory.length - 1]}
              onBack={goBack}
              selected={selectedChoiceIndex === 0} // First choice is previous choice
            />
            {/* Divider Line */}
            <div style={{
              width: '100%',
              height: '1px',
              backgroundColor: '#666',
              margin: '20px 0',
              opacity: 0.5
            }} />
            <h3 style={{
              color: '#999',
              fontSize: '16px',
              marginBottom: '20px',
              fontWeight: 'normal'
            }}>
              Available Choices
            </h3>
          </>
        )}



        {/* Container for choices with condition bubbles */}
        <div style={{ position: 'relative' }} key={`bubbles-container-${bubbleRenderKey}`}>
          {/* Condition bubbles on the left */}
          {choiceOptions
            .map((option, originalIndex) => ({ option, originalIndex })) // Preserve original index
            .filter(({ option, originalIndex }) => {
              // In story only mode, hide choices with unmet conditions
              if (storyModeSettings.enabled && storyModeSettings.hideInactiveChoices && option.disabled) {
                return false;
              }
              return true;
            })
            .map(({ option, originalIndex }, filteredIndex) => {
            // Debug condition bubble creation
            console.log('🔍 CONDITION BUBBLE CHECK:', {
              originalIndex: originalIndex,
              filteredIndex: filteredIndex,
              hasCondition: !!option.condition,
              condition: option.condition,
              disabled: option.disabled,
              hasNodeRef: !!nodeRefs.current[filteredIndex],
              bubbleRenderKey: bubbleRenderKey
            });

            const shouldRenderBubble = option.condition && nodeRefs.current[filteredIndex] && bubbleRenderKey > 0 && !storyOnlyMode;
            console.log('🔍 CONDITION BUBBLE RENDER DECISION:', {
              originalIndex: originalIndex,
              filteredIndex: filteredIndex,
              shouldRenderBubble: shouldRenderBubble,
              hasCondition: !!option.condition,
              hasNodeRef: !!nodeRefs.current[filteredIndex],
              bubbleRenderKey: bubbleRenderKey
            });

            if (shouldRenderBubble) {
              console.log('🔍 CREATING CONDITION BUBBLE FOR FILTERED INDEX:', filteredIndex);
              return (
                <ConditionBubble
                  key={`condition-bubble-${currentNode.Properties.Id}-${originalIndex}-${option.condition}`}
                  condition={option.condition}
                  nodeRef={nodeRefs.current[filteredIndex]}
                  disabled={option.disabled}
                />
              );
            }
            return null;
          })}

          {/* Show each choice as individual panels */}
          {choiceOptions
            .map((option, originalIndex) => ({ option, originalIndex })) // Preserve original index
            .filter(({ option, originalIndex }) => {
              // In story only mode, hide choices with unmet conditions
              if (storyModeSettings.enabled && storyModeSettings.hideInactiveChoices && option.disabled) {
                return false;
              }
              return true;
            })
            .map(({ option, originalIndex }, filteredIndex) => {
            // Calculate if this choice is selected (account for previous choice offset)
            const hasPreviousChoice = showPrevious && previousChoiceHistory.length > 0;
            const adjustedSelectedIndex = hasPreviousChoice ? selectedChoiceIndex - 1 : selectedChoiceIndex;
            const isSelected = filteredIndex === adjustedSelectedIndex;

            // Get the full text content from the target node (same logic as regular nodes)
            let choiceNodeText = 'No content';
            const targetNode = option.targetNode;

            // Special handling for Hub nodes - they never have body text
            if (targetNode.Type === 'Hub') {
              choiceNodeText = '';
            } else {
              // Priority order for text content:
              // 1. Text property (main content)
              // 2. Expression property (for instruction nodes)
              // 3. DisplayName as fallback
              if (targetNode.Properties.Text && targetNode.Properties.Text.trim()) {
                choiceNodeText = targetNode.Properties.Text;
              } else if (targetNode.Properties.Expression && targetNode.Properties.Expression.trim()) {
                choiceNodeText = targetNode.Properties.Expression;
              } else if (targetNode.Properties.DisplayName && targetNode.Properties.DisplayName.trim()) {
                choiceNodeText = targetNode.Properties.DisplayName;
              }
            }

            // Determine the title for the choice panel
            // Use the same logic as main display to ensure consistency
            let choiceTitle = targetNode.Properties.DisplayName || undefined;

            // Check if target node is a dialogue fragment and use speaker name with icon
            const isTargetDialogueFragment = targetNode.Type === "DialogueInteractiveFragmentTemplate" ||
                                           targetNode.Type === "DialogueExplorationFragmentTemplate" ||
                                           targetNode.Type === "DialogueFragment" ||
                                           targetNode.Type === "DialogueIntActionTemplate";

            let choiceStageDirections = undefined;
            if (isTargetDialogueFragment) {
              const speakerTitle = getSpeakerNameWithIcon(targetNode);
              if (speakerTitle) {
                choiceTitle = speakerTitle;
              }
              // Get stage directions for dialogue fragment choices
              if (targetNode.Properties.StageDirections && targetNode.Properties.StageDirections.trim()) {
                choiceStageDirections = targetNode.Properties.StageDirections;
              }
            } else if (targetNode.Type === "Hub") {
              // Hub nodes should show their DisplayName as title
              choiceTitle = targetNode.Properties.DisplayName || 'Hub';
            } else if (targetNode.Type === "Instruction") {
              // For instruction nodes, always show DisplayName as title
              choiceTitle = targetNode.Properties.DisplayName || undefined;
            }

            return (
              <div
                key={originalIndex}
                ref={nodeRefs.current[filteredIndex]}
                style={{
                  marginBottom: '15px',
                  opacity: option.disabled ? 0.5 : 1, // Fade out disabled choices
                  filter: option.disabled ? 'grayscale(30%)' : 'none', // Add slight grayscale effect
                  transition: 'opacity 0.3s ease, filter 0.3s ease' // Smooth transition
                }}
              >
                <QuestionPanel
                  text={choiceNodeText}
                  title={choiceTitle}
                  stageDirections={choiceStageDirections}
                  color={option.targetNode.Properties.Color || currentNode.Properties.Color}
                  choices={[{
                    text: "Next",
                    disabled: option.disabled,
                    onClick: () => handleChoiceSelect(originalIndex)
                  }]}
                  selected={isSelected}
                />
              </div>
            );
          })}
        </div>

          <div style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
            <strong>Navigation:</strong> Use ↑↓ arrow keys to select, Enter to choose, Esc to cancel<br />
            <strong>Selected:</strong> {selectedChoiceIndex + 1} of {getCurrentAvailableChoices().length}<br />
            <strong>Debug Info:</strong> Node ID: {currentNode.Properties.Id}, Type: {currentNode.Type}
          </div>
        </div>
      </div>
    );
  }



  // Render regular node - get the best text content available
  let nodeText = 'No content';
  let nodeTitle = currentNode.Properties.DisplayName || undefined;

  // Check if this is a dialogue fragment and use speaker name with icon for title
  const isDialogueFragment = currentNode.Type === "DialogueInteractiveFragmentTemplate" ||
                            currentNode.Type === "DialogueExplorationFragmentTemplate" ||
                            currentNode.Type === "DialogueFragment";

  let stageDirections = undefined;
  if (isDialogueFragment) {
    const speakerTitle = getSpeakerNameWithIcon(currentNode);
    if (speakerTitle) {
      nodeTitle = speakerTitle;
    }
    // Get stage directions for dialogue fragments
    if (currentNode.Properties.StageDirections && currentNode.Properties.StageDirections.trim()) {
      stageDirections = currentNode.Properties.StageDirections;
    }
  }

  // Priority order for text content:
  // 1. Text property (main content)
  // 2. Expression property (for instruction nodes)
  // 3. DisplayName as fallback
  // Special case: Hub nodes should only show their DisplayName as title, no body text
  if (currentNode.Type === "Hub") {
    nodeText = ''; // Hub nodes have no body text, only title
    nodeTitle = currentNode.Properties.DisplayName || 'Hub';
  } else if (currentNode.Properties.Text && currentNode.Properties.Text.trim()) {
    nodeText = currentNode.Properties.Text;
  } else if (currentNode.Properties.Expression && currentNode.Properties.Expression.trim()) {
    nodeText = currentNode.Properties.Expression;
    // For instruction nodes, always show DisplayName as title even if Expression is used for text
    // This ensures nodes like "//HUB - PerForge Conversation Hub Start" show the full title
    if (currentNode.Type === "Instruction") {
      nodeTitle = currentNode.Properties.DisplayName || undefined;
    }
  } else if (currentNode.Properties.DisplayName && currentNode.Properties.DisplayName.trim()) {
    nodeText = currentNode.Properties.DisplayName;
    nodeTitle = undefined; // Don't duplicate title and text
  }



  return (
    <div>
      {/* Panels */}
      {project && (
        <>
          <VariablesPanel
            project={project}
            currentNode={currentNode}
            onWidthChange={setVariablesPanelWidth}
            showPrevious={showPrevious}
            onTogglePrevious={() => setShowPrevious(!showPrevious)}
            hasPreviousChoice={previousChoiceHistory.length > 0}
            isVisible={isVariablesPanelVisible}
            onToggleVisibility={handleVariablesPanelToggle}
            onToggleSearchPanel={handleSearchPanelToggle}
            isSearchPanelVisible={isSearchPanelVisible}
            storyOnlyMode={storyOnlyMode}
            storyModeSettings={storyModeSettings}
            tempStoryModeSettings={tempStoryModeSettings}
            onToggleStoryOnlyMode={handleStoryOnlyModeToggle}
            onTempStoryModeSettingChange={handleTempStoryModeSettingChange}
            onStoryModeApply={handleStoryModeApplyAndClose}
            onStoryModePreset={handleStoryModePreset}
            onDropdownOpenChange={handleDropdownOpenChange}
            dropdownOpen={dropdownOpen}
          />
          <SearchNodesPanel
            project={project}
            currentNode={currentNode}
            onWidthChange={setSearchPanelWidth}
            onNavigateToNode={handleNavigateToNode}
            isVisible={isSearchPanelVisible}
            onToggleVisibility={handleSearchPanelToggle}
            onToggleVariablesPanel={handleVariablesPanelToggle}
            isVariablesPanelVisible={isVariablesPanelVisible}
            storyOnlyMode={storyOnlyMode}
            storyModeSettings={storyModeSettings}
            tempStoryModeSettings={tempStoryModeSettings}
            onToggleStoryOnlyMode={handleStoryOnlyModeToggle}
            onTempStoryModeSettingChange={handleTempStoryModeSettingChange}
            onStoryModeApply={handleStoryModeApplyAndClose}
            onStoryModePreset={handleStoryModePreset}
            onDropdownOpenChange={handleDropdownOpenChange}
            dropdownOpen={dropdownOpen}
          />
        </>
      )}

      {/* Keyboard shortcuts helper - exactly like 3.x version */}
      {project && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000,
          fontFamily: 'monospace'
        }}>
          ↑↓ Navigate • Enter Select • Ctrl+R Restart • Ctrl+L Load
        </div>
      )}

      <div style={{
        padding: '5px 20px',
        maxWidth: '800px',
        margin: '0 auto',
        marginLeft: calculateMarginLeft(totalPanelWidth),
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Previous choice display */}
        {showPrevious && previousChoiceHistory.length > 0 && (
          <>
            <PreviousChoiceDisplay
              previousChoice={previousChoiceHistory[previousChoiceHistory.length - 1]}
              onBack={goBack}
              selected={selectedChoiceIndex === 0} // First choice is previous choice
            />
            {/* Divider Line */}
            <div style={{
              width: '100%',
              height: '1px',
              backgroundColor: '#666',
              margin: '20px 0',
              opacity: 0.5
            }} />
            <h3 style={{
              color: '#999',
              fontSize: '16px',
              marginBottom: '20px',
              fontWeight: 'normal'
            }}>
              Available Choices
            </h3>
          </>
        )}

        <InstructionPanel
          text={nodeText}
          title={nodeTitle}
          stageDirections={stageDirections}
          color={currentNode.Properties.Color}
          button={{
            hidden: false,
            text: "Next",
            onClick: handleNext
          }}
          selected={!(showPrevious && previousChoiceHistory.length > 0 && selectedChoiceIndex === 0)}
        />

        <div style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
          <strong>Debug Info:</strong><br />
          Node ID: {currentNode.Properties.Id}<br />
          Node Type: {currentNode.Type}<br />
          History Length: {nodeHistory.length}<br />
          Previous Choices: {previousChoiceHistory.length}<br />
          Text: {nodeText.substring(0, 50)}...
        </div>
      </div>
    </div>
  );
};

export default InteractiveArticyViewer;
