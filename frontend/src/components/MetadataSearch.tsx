import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import API_ENDPOINTS from '../config/api';
import axios from 'axios';

interface MetadataSearchResult {
  id: string | number;
  title: string;
  releaseYear?: number;
  coverUrl?: string;
  relevanceScore: number;
  source: string;
}

interface MetadataSource {
  name: string;
  available: boolean;
  priority: number;
}

interface MetadataSearchProps {
  gameId: number;
  currentTitle: string;
  onMetadataSelected?: (result: MetadataSearchResult) => void;
  onEnrichmentComplete?: () => void;
}

const MetadataSearch: React.FC<MetadataSearchProps> = ({
  gameId,
  currentTitle,
  onMetadataSelected,
  onEnrichmentComplete
}) => {
  const [searchQuery, setSearchQuery] = useState(currentTitle);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<MetadataSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get available metadata sources
  const { data: sources } = useQuery({
    queryKey: ['metadata-sources'],
    queryFn: async (): Promise<MetadataSource[]> => {
      const response = await axios.get(API_ENDPOINTS.METADATA_SOURCES);
      return response.data;
    }
  });

  // Search metadata mutation
  const searchMutation = useMutation({
    mutationFn: async ({ query, sources }: { query: string; sources?: string[] }) => {
      const params = new URLSearchParams({
        query,
        maxResults: '10'
      });
      
      if (sources && sources.length > 0) {
        params.append('sources', sources.join(','));
      }
      
      const response = await axios.get(`${API_ENDPOINTS.METADATA_SEARCH}?${params}`);
      return response.data;
    },
    onSuccess: (results) => {
      setSearchResults(results);
      setIsSearching(false);
    },
    onError: (error) => {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  });

  // Enrich metadata mutation
  const enrichMutation = useMutation({
    mutationFn: async ({ gameId, searchQuery, sources }: { 
      gameId: number; 
      searchQuery?: string; 
      sources?: string[] 
    }) => {
      const response = await axios.post(`${API_ENDPOINTS.METADATA_ENRICH}/${gameId}`, {
        searchQuery,
        sources
      });
      return response.data;
    },
    onSuccess: () => {
      onEnrichmentComplete?.();
      alert('Metadata enrichment completed successfully!');
    },
    onError: (error) => {
      console.error('Enrichment error:', error);
      alert('Error enriching metadata. Please try again.');
    }
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    searchMutation.mutate({
      query: searchQuery,
      sources: selectedSources.length > 0 ? selectedSources : undefined
    });
  };

  const handleSourceToggle = (sourceName: string) => {
    setSelectedSources(prev => 
      prev.includes(sourceName)
        ? prev.filter(s => s !== sourceName)
        : [...prev, sourceName]
    );
  };

  const handleSelectResult = (result: MetadataSearchResult) => {
    onMetadataSelected?.(result);
    enrichMutation.mutate({
      gameId,
      searchQuery: result.title,
      sources: [result.source]
    });
  };

  const handleAutoEnrich = () => {
    enrichMutation.mutate({
      gameId,
      searchQuery: searchQuery || currentTitle,
      sources: selectedSources.length > 0 ? selectedSources : undefined
    });
  };

  return (
    <div className="metadata-search">
      <h3>Search & Enrich Metadata</h3>
      
      {/* Available Sources */}
      <div className="sources-section">
        <h4>Available Sources</h4>
        <div className="sources-grid">
          {sources?.map((source) => (
            <label key={source.name} className={`source-item ${!source.available ? 'unavailable' : ''}`}>
              <input
                type="checkbox"
                checked={selectedSources.includes(source.name)}
                onChange={() => handleSourceToggle(source.name)}
                disabled={!source.available}
              />
              <span className="source-name">{source.name}</span>
              <span className="source-status">
                {source.available ? '✓' : '✗'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="search-section">
        <div className="search-input-group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter game title to search..."
            className="search-input"
          />
          <button 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="search-button"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <button 
          onClick={handleAutoEnrich}
          disabled={enrichMutation.isPending}
          className="auto-enrich-button"
        >
          {enrichMutation.isPending ? 'Enriching...' : 'Auto-Enrich Metadata'}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="results-section">
          <h4>Search Results</h4>
          <div className="results-grid">
            {searchResults.map((result, index) => (
              <div key={`${result.source}-${result.id}`} className="result-item">
                {result.coverUrl && (
                  <img 
                    src={result.coverUrl} 
                    alt={result.title}
                    className="result-cover"
                  />
                )}
                <div className="result-info">
                  <h5>{result.title}</h5>
                  {result.releaseYear && <p>Year: {result.releaseYear}</p>}
                  <p>Source: {result.source}</p>
                  <p>Relevance: {Math.round(result.relevanceScore * 100)}%</p>
                  <button 
                    onClick={() => handleSelectResult(result)}
                    className="select-result-button"
                    disabled={enrichMutation.isPending}
                  >
                    Use This Result
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetadataSearch;
