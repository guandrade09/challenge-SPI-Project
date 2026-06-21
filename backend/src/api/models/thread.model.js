export default class threadsConsume {
  constructor({ timestamp, thread_name, quantity_of_cpu_ind_percentage }) {
    this.timestamp = new Date.now().toISOString();
    this.thread_name = thread_name;
    this.quantity_of_cpu_ind_percentage = quantity_of_cpu_ind_percentage;
    this.process_loaded = process_loaded;
  }
}