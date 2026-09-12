export default function JobOrderPanel({
  jobOrders,
  selectedJob,
  onSelect,
}) {
  return (
    <div className="jobPanel">
      <h3>MES İş Emirleri</h3>

      {jobOrders.length === 0 ? (
        <p>İş emri yok</p>
      ) : (
        jobOrders.map((job) => (
          <button
            key={job}
            className={selectedJob === job ? "job active" : "job"}
            onClick={() => onSelect(job)}
          >
            {job}
          </button>
        ))
      )}
    </div>
  );
}