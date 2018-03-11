export default function rehydrateSchemaInfo(oldInfo, newInfo) {
  //   console.log(oldInfo);
  //   console.log(newInfo);
  // Shortcut first. If both arrs same length, return the old one.
  if (!oldInfo || !newInfo) {
    return newInfo;
  }
  return oldInfo.length === newInfo.length ? oldInfo : newInfo;
}
