import { S as SecureStorageBase } from "./base-DsnN1Jp-.js";
import "./index-BXJC4laN.js";
class SecureStorageNative extends SecureStorageBase {
  constructor(capProxy) {
    super();
    const proxy = capProxy;
    this.setSynchronizeKeychain = proxy.setSynchronizeKeychain;
    this.internalGetItem = proxy.internalGetItem;
    this.internalSetItem = proxy.internalSetItem;
    this.internalRemoveItem = proxy.internalRemoveItem;
    this.clearItemsWithPrefix = proxy.clearItemsWithPrefix;
    this.getPrefixedKeys = proxy.getPrefixedKeys;
  }
  // @native
  async setSynchronizeKeychain(_options) {
  }
  // @native
  async internalGetItem(_options) {
    return { data: "" };
  }
  // @native
  async internalSetItem(_options) {
  }
  // @native
  async internalRemoveItem(_options) {
    return { success: true };
  }
  async clear(sync) {
    return this.tryOperation(async () => this.clearItemsWithPrefix({
      prefix: this.prefix,
      sync: sync !== null && sync !== void 0 ? sync : this.sync
    }));
  }
  // @native
  async clearItemsWithPrefix(_options) {
  }
  // @native
  async getPrefixedKeys(_options) {
    return { keys: [] };
  }
}
export {
  SecureStorageNative
};
