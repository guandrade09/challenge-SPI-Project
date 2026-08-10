import { BasePanelModal } from '../../components/shared/BasePanelModal';
import { LogSettingsButton } from './components/painelLog';

export const RenderColumn = ({ config, componentMap, theme = "dynamic" }) => {
  const isSinglePanel = config.length === 1;

  return (
    <div className="w-full flex flex-col gap-8 h-full min-h-0 justify-stretch items-stretch">
      {config.map((panelGroup, idx) => {
        const charts = panelGroup.map((id) => {
          const item = componentMap[id];
          return item ?? { id, label: "Erro", component: <div /> };
        });

        const isLogPanel = panelGroup.includes('logs');

        return (
          <div
            key={idx}
            className={isSinglePanel ? "w-full h-full flex-1 min-h-0" : idx === 0 ? "h-[45%] shrink-0 min-h-0" : "flex-1 min-h-0"}
          >
            <BasePanelModal
              theme={theme}
              title={charts.length === 1 ? charts[0].label : ""}
              isGraf={!isLogPanel}
              allowFullScreen={!isLogPanel}
              headerAction={isLogPanel ? <LogSettingsButton /> : null}
              availableCharts={charts}
              className="w-full h-full text-[var(--p-text)]"
            />
          </div>
        );
      })}
    </div>
  );
};

export default RenderColumn;