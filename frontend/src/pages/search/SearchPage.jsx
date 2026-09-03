import React, { useState } from 'react';
import { ragService } from '../../services/ragService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Search,
  BookOpen,
  Sparkles,
} from 'lucide-react';

const POPULAR_QUERIES = [
  'Factory Licence requirements',
  'Pollution control category consent',
  'Fire and rescue department safety norms',
  'Building layout plan approval',
  'Environmental clearance threshold',
];

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (queryText = null) => {
    const q = (queryText || query).trim();
    if (!q) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await ragService.searchRegulations(q, 6);
      setResults(data.results || []);
    } catch (err) {
      console.error('RAG search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Search Header */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8E7] shadow-xs space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#E6F2F2] text-[#006B68] text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            RAG Vector Search Engine
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172126] tracking-tight">
            Regulatory Knowledge Index & Acts
          </h1>
          <p className="text-xs sm:text-sm text-[#66757A]">
            Query statutory clauses, compliance requirements, and government mandates using vector similarity search.
          </p>
        </div>

        {/* Search input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-2 pt-1"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#66757A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search regulations (e.g. Factory Act, pollution limits, building safety)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-xs sm:text-sm border border-[#E2E8E7] bg-white text-[#172126] placeholder-[#9AA5A8] focus:outline-none focus:border-[#006B68] focus:ring-2 focus:ring-[#006B68]/15"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Search}
            loading={loading}
          >
            Search Index
          </Button>
        </form>

        {/* Suggested Queries */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-medium text-[#66757A]">Suggested:</span>
          {POPULAR_QUERIES.map((tag, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(tag);
                handleSearch(tag);
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-[#F0F4F4] text-[#4D5C61] hover:bg-[#E6F2F2] hover:text-[#006B68] transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : searched && results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Regulatory Documents Matched"
          description={`No regulatory clauses matched "${query}". Try adjusting your keywords.`}
        />
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#66757A]">
            <span>Showing {results.length} relevant statutory extracts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((item, idx) => (
              <Card key={idx} className="p-4 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-[#172126] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#006B68]" />
                      {item.source || 'Regulation Source'}
                    </span>
                    {item.score !== undefined && (
                      <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded bg-[#E6F2F2] text-[#006B68]">
                        Score: {typeof item.score === 'number' ? item.score.toFixed(3) : item.score}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#172126] leading-relaxed bg-[#F8FAF9] p-3 rounded-lg border border-[#E2E8E7] italic">
                    "{item.text}"
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
