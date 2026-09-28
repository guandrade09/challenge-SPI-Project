import { normalizeBrasiliaTimestamp } from "../utils/convert.js";

export default class threadsConsume {
  constructor({ timestamp, thread_name, quantity_of_cpu_ind_percentage, process_loaded }) {
    this.timestamp = timestamp ? timestamp : normalizeBrasiliaTimestamp();
    this.thread_name = thread_name;
    this.quantity_of_cpu_ind_percentage = quantity_of_cpu_ind_percentage;
    this.process_loaded = process_loaded;
  }
}