import React, { useState, useEffect, useCallback } from 'react';
import { Button, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import ArticyProject from '../utils/ArticyProject';
import InstructionPanel from '../panels/InstructionPanel';
import EndOfFlowPanel from '../panels/EndOfFlowPanel';
import QuestionPanel from '../panels/QuestionPanel';
import VariablesPanel from './VariablesPanel';
import SearchNodesPanel from './SearchNodesPanel';

interface InteractiveArticyViewerProps {
  data: any;
  onReset: () => void;
  onPanelWidthChange?: (width: number) => void;
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
            {previousChoice.choiceTitle}
          </div>
        )}
        <div style={{
          backgroundColor: backgroundColor,
          border: `2px solid ${frameColor}`,
          borderRadius: '4px',
          padding: '12px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          {previousChoice.choiceText}
        </div>
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

const InteractiveArticyViewer: React.FC<InteractiveArticyViewerProps> = ({ data, onReset, onPanelWidthChange }) => {
  const [project, setProject] = useState<ArticyProject | undefined>(undefined);
  const [currentNode, setCurrentNode] = useState<any>(null);
  const [nodeHistory, setNodeHistory] = useState<any[]>([]);
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOption[]>([]);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);
  const [showingChoices, setShowingChoices] = useState(false);

  // Panel state management
  const [variablesPanelWidth, setVariablesPanelWidth] = useState(0);
  const [searchPanelWidth, setSearchPanelWidth] = useState(0);
  const [isVariablesPanelVisible, setIsVariablesPanelVisible] = useState(false);
  const [isSearchPanelVisible, setIsSearchPanelVisible] = useState(false);

  // Previous choice history for back navigation
  const [previousChoiceHistory, setPreviousChoiceHistory] = useState<PreviousChoice[]>([]);
  const [showPrevious, setShowPrevious] = useState(true);

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
          setCurrentNode(startNode);
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
        setCurrentNode(targetNode);
      }, 0);
    }
  };

  // Go back to previous choice
  const goBack = () => {
    if (previousChoiceHistory.length > 0) {
      const lastChoice = previousChoiceHistory[previousChoiceHistory.length - 1];

      // Restore variables state
      if (project && lastChoice.variables) {
        project.variables = { ...lastChoice.variables };
      }

      // Restore node list and current node
      setNodeHistory(lastChoice.nodeList);

      // Set current node to the last node in the restored history
      if (lastChoice.nodeList.length > 0) {
        setCurrentNode(lastChoice.nodeList[lastChoice.nodeList.length - 1]);
      } else {
        // If no history, go back to the previous choice node itself
        setCurrentNode(lastChoice.node);
      }

      // Remove the last choice from history
      setPreviousChoiceHistory(previousChoiceHistory.slice(0, -1));

      // Reset choice state
      setShowingChoices(false);
      setChoiceOptions([]);

      console.log('🔙 Went back to previous choice');
    }
  };

  // Get all output connections from a node
  const getCurrentNodeOutputs = useCallback(() => {
    if (!currentNode || !currentNode.Properties.OutputPins) return [];

    const outputs: ChoiceOption[] = [];

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

            outputs.push({
              text: choiceText,
              targetNode: targetNode,
              disabled: false, // TODO: Add condition checking
              condition: connection.Condition || targetNode.Properties.InputPins?.[0]?.Text
            });
          }
        });
      }
    });

    return outputs;
  }, [currentNode, project]);

  // Handle Next button - enhanced navigation
  const handleNext = () => {
    if (!project || !currentNode) return;

    const outputs = getCurrentNodeOutputs();

    if (outputs.length === 0) {
      // End of flow - no outputs
      const endNode = { Type: "EndOfFlow", Properties: {} };
      setCurrentNode(endNode);
      setShowingChoices(false);
    } else if (outputs.length === 1) {
      // Single output - navigate directly but store previous choice
      const targetNode = outputs[0].targetNode;

      // Store previous choice for single-output navigation
      const previousChoice: PreviousChoice = {
        node: currentNode,
        choiceText: outputs[0].text,
        choiceTitle: currentNode.Properties.DisplayName,
        color: currentNode.Properties.Color,
        nodeList: [...nodeHistory],
        variables: project ? { ...project.variables } : {},
        fromMultiChoice: false
      };
      setPreviousChoiceHistory([...previousChoiceHistory, previousChoice]);

      // Store variables from the current node before navigating
      if (project) {
        project.StoreVariablesFromNode(currentNode);
      }

      setCurrentNode(targetNode);
      setNodeHistory([...nodeHistory, targetNode]);
      setShowingChoices(false);
      console.log('🔄 Navigated to:', targetNode.Properties.Id, targetNode.Type);
    } else {
      // Multiple outputs - check if this is a dialogue node that should show content first
      const isDialogueFragment = currentNode.Type === "DialogueInteractiveFragmentTemplate" ||
                                currentNode.Type === "DialogueExplorationFragmentTemplate" ||
                                currentNode.Type === "DialogueFragment";

      if (isDialogueFragment && !showingChoices) {
        // For dialogue fragments, show choices after showing content
        setChoiceOptions(outputs);
        setSelectedChoiceIndex(0);
        setShowingChoices(true);
        console.log('🔀 Showing', outputs.length, 'dialogue choices');
      } else {
        // For Hub nodes and other multi-output nodes, show choices immediately
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
      const previousChoice: PreviousChoice = {
        node: currentNode,
        choiceText: selectedChoice.text,
        choiceTitle: currentNode.Properties.DisplayName,
        color: currentNode.Properties.Color,
        nodeList: [...nodeHistory],
        variables: project ? { ...project.variables } : {},
        fromMultiChoice: choiceOptions.length > 1
      };
      setPreviousChoiceHistory([...previousChoiceHistory, previousChoice]);
    }

    // Store variables from the current node before navigating
    if (project) {
      project.StoreVariablesFromNode(currentNode);
    }

    // Navigate to the selected choice
    setCurrentNode(targetNode);
    setNodeHistory([...nodeHistory, targetNode]);
    setShowingChoices(false);
    setChoiceOptions([]);

    console.log('✅ Selected choice:', selectedChoice.text);
    console.log('🔄 Navigated to:', targetNode.Properties.Id, targetNode.Type);
  };

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
    const availableChoices = getCurrentAvailableChoices();
    if (availableChoices.length === 0) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setSelectedChoiceIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : availableChoices.length - 1;
          console.log('🔼 Selected choice:', newIndex + 1, 'of', availableChoices.length);
          return newIndex;
        });
        break;
      case 'ArrowDown':
        event.preventDefault();
        setSelectedChoiceIndex(prev => {
          const newIndex = prev < availableChoices.length - 1 ? prev + 1 : 0;
          console.log('🔽 Selected choice:', newIndex + 1, 'of', availableChoices.length);
          return newIndex;
        });
        break;
      case 'Enter':
        event.preventDefault();
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
      case 'Escape':
        event.preventDefault();
        console.log('⎋ Cancelling choice selection');
        setShowingChoices(false);
        setChoiceOptions([]);
        break;
    }
  }, [getCurrentAvailableChoices, selectedChoiceIndex, showPrevious, previousChoiceHistory.length, goBack, handleNext, handleChoiceSelect]);

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

  // Handle Hub nodes that should show choices immediately
  useEffect(() => {
    if (!currentNode || !project) return;

    const outputs = getCurrentNodeOutputs();

    // Hub nodes are LocationTemplate nodes or nodes with "HUB" in their name and multiple outputs
    const isHubStyleNode = (currentNode.Type === "LocationTemplate" ||
                           currentNode.Type === "Hub" ||
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

  // Handle restart
  const handleRestart = () => {
    if (project) {
      project.ResetVariablesToInitialState();
      const startNode = project.GetStartNode();
      if (startNode) {
        setCurrentNode(startNode);
        setNodeHistory([startNode]);
        setShowingChoices(false);
        setChoiceOptions([]);
        setSelectedChoiceIndex(0);
        setPreviousChoiceHistory([]);
      }
    }
  };

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

        <div style={{
          padding: '20px',
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

        {/* Show current node info */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: 'rgba(255, 255, 255, 0.87)', marginBottom: '10px' }}>{nodeTitle || 'Available Choices'}</h3>
        </div>

        {/* Show each choice as individual panels */}
        {choiceOptions.map((option, index) => {
          // Calculate if this choice is selected (account for previous choice offset)
          const hasPreviousChoice = showPrevious && previousChoiceHistory.length > 0;
          const adjustedSelectedIndex = hasPreviousChoice ? selectedChoiceIndex - 1 : selectedChoiceIndex;
          const isSelected = index === adjustedSelectedIndex;

          return (
            <div key={index} style={{ marginBottom: '15px' }}>
              <QuestionPanel
                text={option.text}
                title={undefined}
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

      <div style={{
        padding: '20px',
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
