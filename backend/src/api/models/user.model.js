export default class User {
  constructor({ timestamp, name, email, password, confirmPassword}) {
    this.timestamp = timestamp;
    this.name = name;
    this.email = email;
    this.password = password;
    this.confirmPassword = confirmPassword;
  }
}