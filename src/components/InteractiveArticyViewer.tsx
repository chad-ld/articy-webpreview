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
            {/* Check if this is a dialogue fragment by looking at the node type */}
            {(previousChoice.node.Type === "DialogueInteractiveFragmentTemplate" ||
              previousChoice.node.Type === "DialogueExplorationFragmentTemplate" ||
              previousChoice.node.Type === "DialogueFragment") ? (
              <span>
                <CommentOutlined style={{ marginRight: '6px' }} />
                {previousChoice.choiceTitle}
              </span>
            ) : (
              previousChoice.choiceTitle
            )}
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

  // Custom navigation function that handles Jump nodes automatically
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

    // For non-Jump nodes, set as current node normally
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
        // Check if the restored node is a hub-style node
        const isHubStyleNode = (lastChoice.node.Type === "Hub" ||
                               lastChoice.node.Type === "DialogueIntActionTemplate" ||
                               (lastChoice.node.Type === "Instruction" &&
                                (lastChoice.node.Properties.DisplayName?.includes("HUB") ||
                                 lastChoice.node.Properties.Expression?.includes("HUB"))));

        if (isHubStyleNode) {
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
      // Single output - navigate directly WITHOUT storing previous choice
      // (Previous choices should only be stored for actual branching decisions)
      const targetNode = outputs[0].targetNode;

      console.log('🔄 Single output navigation (no choice stored):', {
        fromNodeId: currentNode.Properties.Id,
        fromNodeType: currentNode.Type,
        toNodeId: targetNode.Properties.Id,
        toNodeType: targetNode.Type
      });

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
      // BUT: Don't store hub-style nodes as previous choices since they show choices immediately
      // NOTE: Condition nodes should NOT be treated as hub-style nodes - they show content first, then choices
      const isHubStyleNode = (currentNode.Type === "Hub" ||
                             currentNode.Type === "DialogueIntActionTemplate" ||
                             (currentNode.Type === "Instruction" &&
                              (currentNode.Properties.DisplayName?.includes("HUB") ||
                               currentNode.Properties.Expression?.includes("HUB"))));

      // Check if this is a dialogue fragment (needed for both hub and non-hub logic)
      const isDialogueFragment = currentNode.Type === "DialogueInteractiveFragmentTemplate" ||
                                currentNode.Type === "DialogueExplorationFragmentTemplate" ||
                                currentNode.Type === "DialogueFragment";

      if (!isHubStyleNode) {
        const choiceTitle = isDialogueFragment ?
          getSpeakerNameString(currentNode) :
          currentNode.Properties.DisplayName;

        // Get the actual node content for the previous choice display
        let nodeText = 'No content';

        // Priority order for text content (same as main display logic):
        // 1. Text property (main content)
        // 2. Expression property (for instruction nodes)
        // 3. DisplayName as fallback
        if (currentNode.Properties.Text && currentNode.Properties.Text.trim()) {
          nodeText = currentNode.Properties.Text;
        } else if (currentNode.Properties.Expression && currentNode.Properties.Expression.trim()) {
          nodeText = currentNode.Properties.Expression;
        } else if (currentNode.Properties.DisplayName && currentNode.Properties.DisplayName.trim()) {
          nodeText = currentNode.Properties.DisplayName;
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
        console.log('🔀 Hub-style node - NOT storing as previous choice:', {
          nodeId: currentNode.Properties.Id,
          nodeType: currentNode.Type,
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
    if (!choiceOptions[choiceIndex] || choiceOptions[choiceIndex].disabled) return;

    const selectedChoice = choiceOptions[choiceIndex];
    const targetNode = selectedChoice.targetNode;

    // Store previous choice if we have a current node
    if (currentNode) {
      // For choice selections, we need to store information for both:
      // 1. Display: what choice was selected (target node info)
      // 2. Navigation: where to go back to (current choice-offering node)
      const isTargetDialogueFragment = targetNode.Type === "DialogueInteractiveFragmentTemplate" ||
                                      targetNode.Type === "DialogueExplorationFragmentTemplate" ||
                                      targetNode.Type === "DialogueFragment" ||
                                      targetNode.Type === "DialogueIntActionTemplate";

      // For DialogueIntActionTemplate (hub nodes), use the actual node content, not the choice text
      let choiceTitle, choiceText;

      if (targetNode.Type === "DialogueIntActionTemplate") {
        // For hub nodes, show the hub's actual content as the choice text
        choiceText = targetNode.Properties.Text ||
                    targetNode.Properties.Expression ||
                    targetNode.Properties.DisplayName ||
                    selectedChoice.text;
        choiceTitle = targetNode.Properties.DisplayName;
      } else {
        // For other nodes, use the original logic
        choiceText = selectedChoice.text;
        choiceTitle = isTargetDialogueFragment ?
          getSpeakerNameString(targetNode) :
          targetNode.Properties.DisplayName;
      }

      const previousChoice: PreviousChoice = {
        node: currentNode, // Store the choice-offering node for navigation back
        choiceText: choiceText, // Display the selected choice text or target content
        choiceTitle: choiceTitle, // Display the target node title
        color: targetNode.Properties.Color, // Use target node color for display
        nodeList: [...nodeHistory],
        variables: project ? { ...project.variables } : {},
        fromMultiChoice: choiceOptions.length > 1
      };
      console.log('📝 STORING PREVIOUS CHOICE (choice select):', {
        backToNodeId: currentNode.Properties.Id, // Where we'll navigate back to
        backToNodeType: currentNode.Type,
        displayChoiceText: choiceText, // What will be displayed
        displayChoiceTitle: choiceTitle,
        targetNodeId: targetNode.Properties.Id, // Where we're going now
        targetNodeType: targetNode.Type,
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

    // Navigate to the selected choice
    navigateToNode(targetNode);
    setNodeHistory([...nodeHistory, targetNode]);
    setShowingChoices(false);
    setChoiceOptions([]);

    console.log('✅ Selected choice:', selectedChoice.text);
    console.log('🔄 Navigated to:', targetNode.Properties.Id, targetNode.Type);
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
      choices.push(...choiceOptions);
    } else {
      // Single choice or Next button
      choices.push({ isSingleChoice: true, onClick: handleNext });
    }

    return choices;
  }, [showPrevious, previousChoiceHistory.length, showingChoices, choiceOptions, goBack, handleNext]);

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
          // Adjust index for choice options (subtract 1 if previous choice exists)
          const choiceIndex = showPrevious && previousChoiceHistory.length > 0 ?
            selectedChoiceIndex - 1 : selectedChoiceIndex;
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
    nodeRefs.current = choiceOptions.map(() => createRef<HTMLDivElement>());
    console.log('🔍 NODE REFS INITIALIZED:', {
      choiceOptionsLength: choiceOptions.length,
      nodeRefsLength: nodeRefs.current.length,
      choiceConditions: choiceOptions.map((opt, idx) => ({ index: idx, condition: opt.condition, hasCondition: !!opt.condition }))
    });

    // Reset bubble render key when choice options change
    setBubbleRenderKey(0);
  }, [choiceOptions]);

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

    // Hub nodes are nodes with "HUB" in their name and multiple outputs
    // Note: LocationTemplate nodes should show their content first, not immediately show choices
    // DialogueIntActionTemplate nodes should also act as hubs and show choices immediately
    // Condition nodes should NOT be treated as hub-style nodes - they show content first, then choices
    const isHubStyleNode = (currentNode.Type === "Hub" ||
                           currentNode.Type === "DialogueIntActionTemplate" ||
                           (currentNode.Type === "Instruction" &&
                            (currentNode.Properties.DisplayName?.includes("HUB") ||
                             currentNode.Properties.Expression?.includes("HUB"))));

    const shouldShowChoicesImmediately = isHubStyleNode &&
                                         outputs.length > 1 &&
                                         !showingChoices;

    if (shouldShowChoicesImmediately) {
      console.log('🔀 Hub-style node detected - showing choices immediately:', {
        type: currentNode.Type,
        displayName: currentNode.Properties.DisplayName,
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
          {choiceOptions.map((option, index) => {
            // Debug condition bubble creation
            console.log('🔍 CONDITION BUBBLE CHECK:', {
              index: index,
              hasCondition: !!option.condition,
              condition: option.condition,
              disabled: option.disabled,
              hasNodeRef: !!nodeRefs.current[index],
              bubbleRenderKey: bubbleRenderKey
            });

            const shouldRenderBubble = option.condition && nodeRefs.current[index] && bubbleRenderKey > 0;
            console.log('🔍 CONDITION BUBBLE RENDER DECISION:', {
              index: index,
              shouldRenderBubble: shouldRenderBubble,
              hasCondition: !!option.condition,
              hasNodeRef: !!nodeRefs.current[index],
              bubbleRenderKey: bubbleRenderKey
            });

            if (shouldRenderBubble) {
              console.log('🔍 CREATING CONDITION BUBBLE FOR INDEX:', index);
              return (
                <ConditionBubble
                  key={`condition-bubble-${currentNode.Properties.Id}-${index}-${option.condition}`}
                  condition={option.condition}
                  nodeRef={nodeRefs.current[index]}
                  disabled={option.disabled}
                />
              );
            }
            return null;
          })}

          {/* Show each choice as individual panels */}
          {choiceOptions.map((option, index) => {
            // Calculate if this choice is selected (account for previous choice offset)
            const hasPreviousChoice = showPrevious && previousChoiceHistory.length > 0;
            const adjustedSelectedIndex = hasPreviousChoice ? selectedChoiceIndex - 1 : selectedChoiceIndex;
            const isSelected = index === adjustedSelectedIndex;

            // Get the full text content from the target node (same logic as regular nodes)
            let choiceNodeText = 'No content';
            const targetNode = option.targetNode;

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

            // Determine the title for the choice panel
            let choiceTitle = option.text; // Default to choice label

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
            }

            return (
              <div
                key={index}
                ref={nodeRefs.current[index]}
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
                    onClick: () => handleChoiceSelect(index)
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
  if (currentNode.Properties.Text && currentNode.Properties.Text.trim()) {
    nodeText = currentNode.Properties.Text;
  } else if (currentNode.Properties.Expression && currentNode.Properties.Expression.trim()) {
    nodeText = currentNode.Properties.Expression;
  } else if (currentNode.Properties.DisplayName && currentNode.Properties.DisplayName.trim()) {
    nodeText = currentNode.Properties.DisplayName;
    nodeTitle = undefined; // Don't duplicate title and text
  }

  // Debug logging for specific node types
  if (currentNode.Type === "DialogueExplorationActionTemplate" ||
      currentNode.Type === "DialogueIntActionTemplate" ||
      currentNode.Type === "Hub" ||
      currentNode.Type === "LocationTemplate" ||
      currentNode.Type === "BarkJumpTemplate" ||
      (currentNode.Type === "Instruction" && currentNode.Properties.DisplayName?.includes("HUB"))) {
    console.log('🔍 DEBUG - Special node type detected:', {
      type: currentNode.Type,
      id: currentNode.Properties.Id,
      displayName: currentNode.Properties.DisplayName,
      text: currentNode.Properties.Text,
      expression: currentNode.Properties.Expression,
      color: currentNode.Properties.Color,
      outputs: getCurrentNodeOutputs().length,
      resolvedNodeText: nodeText,
      resolvedNodeTitle: nodeTitle
    });
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
