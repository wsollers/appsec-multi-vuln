#include <napi.h>
#include <cstring>

Napi::Value CopyLabel(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::string input = info[0].ToString().Utf8Value();
  char label[32];
  // Synthetic CWE-120: attacker-sized data is copied into a fixed buffer.
  std::memcpy(label, input.data(), input.size() + 1);
  return Napi::String::New(env, label);
}

Napi::Object Initialize(Napi::Env env, Napi::Object exports) {
  exports.Set("copyLabel", Napi::Function::New(env, CopyLabel));
  return exports;
}

NODE_API_MODULE(case087, Initialize)
