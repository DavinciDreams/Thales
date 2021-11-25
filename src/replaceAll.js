import _ from "lodash";

export function replaceAll(str, find, replace) {
    return str.replace(new RegExp(_.escapeRegExp(find), 'g'), replace);
  }