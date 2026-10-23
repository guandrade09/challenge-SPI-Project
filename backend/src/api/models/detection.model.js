export default class Detection {
  constructor({ timestamp, label, confidence, img_Path, img_Frame}) {
    this.timestamp = timestamp;
    this.label = label;
    this.confidence = confidence;
    this.img_Path = img_Path;
    this.img_Frame = img_Frame;
  }
}