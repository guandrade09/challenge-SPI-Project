export default class ChatMessage {
  constructor({ timestamp, user_id, role, content, model, metadata }) {
    this.timestamp = timestamp;
    this.user_id = user_id || null;
    this.role = role;
    this.content = content;
    this.model = model;
    this.metadata = metadata || null;
  }
}
