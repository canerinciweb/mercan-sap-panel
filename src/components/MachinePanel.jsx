export default function MachinePanel({ machines, selectedMachine, setSelectedMachine }) {
  return (
    <div className="machinePanel">
      <h3>Hatlar</h3>

      {machines.map((machine) => (
        <button
          key={machine.name}
          className={selectedMachine === machine.name ? "machine active" : "machine"}
          onClick={() => setSelectedMachine(machine.name)}
        >
          <span>{machine.name}</span>
          <strong>{machine.count}</strong>
        </button>
      ))}
    </div>
  );
}
