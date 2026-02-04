import { BoardProvider } from './hooks/useBoard';
import { Board } from './components/Board';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PasswordGate } from './components/PasswordGate';

function App() {
  return (
    <PasswordGate>
      <ErrorBoundary>
        <BoardProvider>
          <div className="h-screen bg-gray-50 flex flex-col">
            <Board />
          </div>
        </BoardProvider>
      </ErrorBoundary>
    </PasswordGate>
  );
}

export default App;
