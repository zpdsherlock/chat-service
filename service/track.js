function format(value) {
    return Number(value).toFixed(2);
}

class Track {
  constructor() {
    if (!Track.instance) {
      Track.instance = this;
    }
    this.event_map = {};
    this.name_map = {};
    return Track.instance;
  }

  track(name) {
    if (name in this.name_map) {
      this.name_map[name].index += 1;
    } else {
      this.name_map[name] = {
        index: 1,
        costs: [],
        avg: 0,
        min: Infinity,
        max: 0,
      };
    }
    const index = this.name_map[name].index;
    this.event_map[`${name}_${index}`] = Date.now();
    return index;
  }

  mark(name, index) {
    const tag = `${name}_${index}`;
    if (tag in this.event_map) {
      const target = this.name_map[name];
      const data = Date.now() - this.event_map[tag];
      target.avg = (target.avg * target.costs.length + data) / (target.costs.length + 1);
      if (data < target.min) {
        target.min = data;
      }
      if (data > target.max) {
        target.max = data;
      }
      target.costs.push(data);
    }
  }

  print() {
    let output = '';
    for (const key in this.name_map) {
        const target = this.name_map[key];
        output += `${key}: avg=${format(target.avg)}, min=${format(target.min)}, max=${format(target.max)}\n`;
    }
    console.log(output);
  }
}

module.exports = Track;
