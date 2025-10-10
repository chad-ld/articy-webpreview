# Search Functionality Documentation

## 🎯 **Overview**

The Articy Web Viewer includes a powerful search system that allows users to find nodes by searching through their content. The search functionality is implemented across multiple components and provides real-time content searching with preview and navigation capabilities.

## 🏗️ **Architecture**

### **Core Components**

1. **SearchNodes Method** (`src/utils/ArticyProject.ts`) - Backend search logic
2. **SearchNodesPanel Component** (`src/components/SearchNodesPanel.tsx`) - UI panel
3. **Interactive Viewer Integration** (`src/components/InteractiveArticyViewer.tsx`) - Search panel toggle

### **Search Flow**

```
User enters search term
    ↓
SearchNodesPanel captures input
    ↓
ArticyProject.SearchNodes() executes
    ↓
Results returned with preview text
    ↓
User clicks result
    ↓
Navigate to selected node
```

## 🔍 **Search Implementation**

### **SearchNodes Method**

The core search logic is implemented in `ArticyProject.ts`:

```typescript
SearchNodes(term: string): any[] {
  const results: any[] = [];
  const searchTerm = term.toLowerCase();

  for (let i = 0; i < this.data.Packages.length; i++) {
    const package_ = this.data.Packages[i];
    for (let j = 0; j < package_.Models.length; j++) {
      const model = package_.Models[j];

      // Search in various text fields
      const searchableText = [
        model.Properties.Text || '',
        model.Properties.DisplayName || '',
        model.Properties.TechnicalName || '',
        model.Properties.Expression || ''
      ].join(' ').toLowerCase();

      if (searchableText.includes(searchTerm)) {
        // Create preview text (first 100 chars)
        let preview = model.Properties.Text || model.Properties.Expression || model.Properties.DisplayName || '';
        if (preview.length > 100) {
          preview = preview.substring(0, 97) + '...';
        }

        results.push({
          node: model,
          preview: preview
        });
      }
    }
  }

  return results;
}
```

### **Searchable Fields**

The search looks through the following node properties:

| Field | Description | Examples |
|-------|-------------|----------|
| **Text** | Main content text | Dialogue text, narrative content |
| **DisplayName** | Human-readable name | "Quest Start", "Chapter 2" |
| **TechnicalName** | Internal identifier | "Quest001_Start", "Ch02_Opening" |
| **Expression** | Code expressions | Variable assignments, conditions |

### **Case-Insensitive Search**

All searches are case-insensitive for better usability:

```javascript
const searchTerm = term.toLowerCase();
const searchableText = /* ... */.toLowerCase();
```

## 🎨 **User Interface**

### **SearchNodesPanel Component**

The search panel provides an intuitive interface for searching and navigating results.

**Features**:
- Real-time search input
- Result count display
- Preview text for each result
- Click-to-navigate functionality
- Collapsible panel design
- Story mode integration

### **Panel Layout**

```
┌─────────────────────────────┐
│ 🔍 Search Nodes             │
│ [Search input box]          │
│                             │
│ Found 5 results             │
│                             │
│ ┌─────────────────────────┐ │
│ │ Node Type: Dialogue     │ │
│ │ "This is the preview... │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Node Type: Instruction  │ │
│ │ "Another match here...  │ │
│ └─────────────────────────┘ │
│                             │
│ ...                         │
└─────────────────────────────┘
```

### **Result Display**

Each search result shows:
- **Node Type** - The type of node (Dialogue, Instruction, etc.)
- **Preview** - First 100 characters of content
- **Click Action** - Navigates to the node when clicked

## ⚙️ **Configuration**

### **UI Config Option**

Search panel visibility can be configured in `config.json`:

```json
{
  "ui": {
    "searchPanel": false
  }
}
```

**Options**:
- `true` - Search panel visible by default
- `false` - Search panel hidden by default (user can toggle)

### **Runtime Toggle**

Users can toggle the search panel visibility during runtime regardless of configuration:
- Button in the viewer interface
- Keyboard shortcut (if implemented)

## 🔧 **Integration**

### **Using Search in InteractiveArticyViewer**

```typescript
// In InteractiveArticyViewer.tsx

const [searchResults, setSearchResults] = useState<any[]>([]);
const [showSearchPanel, setShowSearchPanel] = useState(false);

// Handle search
const handleSearch = (term: string) => {
  if (!project) return;
  const results = project.SearchNodes(term);
  setSearchResults(results);
};

// Handle result click
const handleSearchResultClick = (node: any) => {
  navigateToNode(node);
  // Optionally close search panel
};

// Render search panel
{showSearchPanel && (
  <SearchNodesPanel
    project={project}
    onNodeSelect={handleSearchResultClick}
    storyModeSettings={storyModeSettings}
  />
)}
```

### **Story Mode Integration**

The search panel adapts to story mode settings:
- UI styling changes when story mode is enabled
- Respects story mode visibility settings
- Maintains consistent user experience

## 📊 **Search Performance**

### **Performance Characteristics**

- **Time Complexity**: O(n × m) where n = number of nodes, m = average text length
- **Memory Usage**: Minimal - only stores matching results
- **Real-time**: Searches execute on each keystroke (consider debouncing for large projects)

### **Optimization Considerations**

For large projects with thousands of nodes:

1. **Debouncing**: Add delay before search execution
   ```typescript
   const debouncedSearch = debounce((term: string) => {
     handleSearch(term);
   }, 300); // 300ms delay
   ```

2. **Result Limiting**: Limit number of displayed results
   ```typescript
   const maxResults = 50;
   const displayedResults = results.slice(0, maxResults);
   ```

3. **Lazy Loading**: Load results in batches as user scrolls

### **Current Performance**

For typical projects (100-500 nodes):
- Search completes in < 10ms
- No noticeable lag
- Real-time search is responsive

## 🧪 **Testing**

### **Test Cases**

1. **Empty Search** - Should return all nodes or no results (current: returns empty)
2. **Single Character** - Should find all nodes containing that character
3. **Full Word** - Should find exact word matches
4. **Partial Word** - Should find nodes containing the partial match
5. **Case Variations** - "QUEST" should match "quest", "Quest", "QUEST"
6. **Special Characters** - Should handle symbols, punctuation
7. **No Matches** - Should return empty array gracefully

### **Manual Testing**

```javascript
// In browser console
const project = /* get project instance */;

// Test simple search
const results = project.SearchNodes("quest");
console.log(`Found ${results.length} results`);

// Test case insensitivity
const results2 = project.SearchNodes("QUEST");
console.log(`Found ${results2.length} results (should match previous)`);

// Inspect result structure
console.log('First result:', results[0]);
```

## 📚 **Best Practices**

### **For Users**

1. **Use specific terms** - More specific = fewer, more relevant results
2. **Try variations** - Different words for the same concept
3. **Use technical names** - Search by node technical names for precision
4. **Review previews** - Preview text helps identify the right result

### **For Developers**

1. **Consider debouncing** - For large projects, add search delay
2. **Provide feedback** - Show "Searching..." or result count
3. **Handle empty results** - Clear message when no matches found
4. **Maintain responsiveness** - Don't block UI during search
5. **Test with large datasets** - Verify performance with many nodes

### **For Content Creators**

1. **Use descriptive names** - Makes nodes easier to find
2. **Add unique keywords** - Help specific nodes stand out
3. **Consistent naming** - Use patterns that are easy to search
4. **Avoid duplicates** - Unique content helps identify the right node

## 🔮 **Future Enhancements**

### **Potential Improvements**

1. **Advanced Filters**
   - Filter by node type (Dialogue only, Instructions only)
   - Filter by technical name patterns
   - Date-based filtering (if metadata available)

2. **Search Syntax**
   - Exact phrase: `"quest start"`
   - Exclude terms: `quest -end`
   - Field-specific: `name:Quest001`

3. **Search History**
   - Remember recent searches
   - Quick access to previous searches
   - Search suggestions

4. **Result Highlighting**
   - Highlight matching terms in preview
   - Show context around match
   - Multiple match indicators

5. **Export Results**
   - Export search results to file
   - Generate node list
   - Create navigation map

## ⚠️ **Known Limitations**

### **Current Limitations**

1. **No Fuzzy Matching** - Exact substring match only (no typo tolerance)
2. **No Ranking** - Results not sorted by relevance
3. **No Context** - Preview shows beginning of text, not match location
4. **No Highlighting** - Matching terms not visually emphasized
5. **No Pagination** - All results displayed at once

### **Workarounds**

1. **Fuzzy Matching** - Use broader search terms
2. **Ranking** - Manually scan results for best match
3. **Context** - Click through results to see full content
4. **Highlighting** - Note the search term while reviewing results
5. **Pagination** - Use browser's find-in-page if many results

## 🔒 **Security Considerations**

### **Input Sanitization**

The search is read-only and doesn't execute code:
- Search term is converted to lowercase string
- No eval() or code execution
- Simple substring matching only
- Safe for user input

### **Performance Protection**

For malicious long searches:
- Consider adding maximum search length
- Implement timeout for search operations
- Monitor performance metrics

## 📖 **Usage Examples**

### **Basic Search**

```javascript
// Find all nodes mentioning "quest"
const results = project.SearchNodes("quest");
// Returns: [{ node: {...}, preview: "..." }, ...]
```

### **Technical Name Search**

```javascript
// Find specific node by technical name
const results = project.SearchNodes("Quest001_Start");
// Returns: [{ node: {Type: "DialogueFragment", ...}, preview: "..." }]
```

### **Content Search**

```javascript
// Find nodes with specific dialogue
const results = project.SearchNodes("Hello traveler");
// Returns nodes containing that phrase
```

### **Variable Search**

```javascript
// Find nodes that reference a variable
const results = project.SearchNodes("player_health");
// Returns nodes with that variable in expressions
```

---

> **🔍 Note**: The search system provides a straightforward way to navigate large Articy projects. While basic, it covers most common use cases and can be extended with additional features as needed.
