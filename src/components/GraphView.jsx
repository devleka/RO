import { motion } from "framer-motion";

export default function GraphView({ supply, demand, allocation }) {
  return (
    <div className="flex justify-between p-8">
      <div>
        {supply.map((s, i) => (
          <div key={i} className="mb-6 bg-blue-200 p-2">
            Source {i} ({s})
          </div>
        ))}
      </div>

      <div>
        {demand.map((d, i) => (
          <div key={i} className="mb-6 bg-red-200 p-2">
            Dest {i} ({d})
          </div>
        ))}
      </div>
    </div>
  );
}
