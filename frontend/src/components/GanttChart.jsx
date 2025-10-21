import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GanttChart = ({ cards, lists }) => {
  const ganttData = useMemo(() => {
    const cardsWithDates = cards.filter(card => card.due_date);
    
    if (cardsWithDates.length === 0) return null;

    const dates = cardsWithDates.map(card => new Date(card.due_date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    const dateRange = daysDiff < 7 ? 7 : daysDiff;

    return {
      cards: cardsWithDates,
      minDate,
      maxDate,
      dateRange
    };
  }, [cards]);

  if (!ganttData || ganttData.cards.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Gantt Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-600">
            No cards with due dates to display in Gantt chart
          </div>
        </CardContent>
      </Card>
    );
  }

  const { cards: cardsWithDates, minDate, maxDate, dateRange } = ganttData;

  const getListTitle = (listId) => {
    const list = lists.find(l => l.id === listId);
    return list ? list.title : 'Unknown';
  };

  const calculatePosition = (dueDate) => {
    const cardDate = new Date(dueDate);
    const dayFromStart = Math.ceil((cardDate - minDate) / (1000 * 60 * 60 * 24));
    return (dayFromStart / dateRange) * 100;
  };

  const generateDateLabels = () => {
    const labels = [];
    const current = new Date(minDate);
    
    for (let i = 0; i <= Math.min(dateRange, 30); i += Math.ceil(dateRange / 6)) {
      const date = new Date(current);
      date.setDate(current.getDate() + i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    return labels;
  };

  const dateLabels = generateDateLabels();

  return (
    <Card className="border-0 shadow-sm" data-testid="gantt-chart">
      <CardHeader>
        <CardTitle className="text-2xl">Gantt Chart Timeline</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Visualizing {cardsWithDates.length} task{cardsWithDates.length !== 1 ? 's' : ''} with due dates
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Date labels */}
          <div className="flex justify-between mb-4 px-4 text-xs font-medium text-gray-600">
            {dateLabels.map((label, idx) => (
              <div key={idx}>{label}</div>
            ))}
          </div>

          {/* Timeline grid */}
          <div className="relative bg-gray-50 rounded-lg p-4 min-h-[400px]">
            {/* Vertical grid lines */}
            <div className="absolute inset-0 flex">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 border-r border-gray-200 last:border-r-0" />
              ))}
            </div>

            {/* Cards */}
            <div className="relative space-y-3">
              {cardsWithDates.map((card, idx) => {
                const position = calculatePosition(card.due_date);
                const today = new Date();
                const dueDate = new Date(card.due_date);
                const isOverdue = dueDate < today;
                const isDueSoon = dueDate - today < 3 * 24 * 60 * 60 * 1000 && dueDate > today;

                return (
                  <div key={card.id} className="relative h-12" data-testid={`gantt-card-${card.id}`}>
                    <div
                      className={`absolute h-full rounded-lg shadow-sm border-2 transition-all hover:shadow-md ${
                        isOverdue
                          ? 'bg-red-100 border-red-400'
                          : isDueSoon
                          ? 'bg-yellow-100 border-yellow-400'
                          : 'bg-blue-100 border-blue-400'
                      }`}
                      style={{
                        left: `${Math.max(0, position - 2)}%`,
                        width: '4%',
                        minWidth: '60px'
                      }}
                    >
                      <div className="flex flex-col justify-center h-full px-2">
                        <div className="text-xs font-medium text-gray-900 truncate" title={card.title}>
                          {card.title}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {getListTitle(card.list_id)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center space-x-6 mt-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400" />
              <span className="text-gray-700">On Track</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-400" />
              <span className="text-gray-700">Due Soon</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-400" />
              <span className="text-gray-700">Overdue</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;
