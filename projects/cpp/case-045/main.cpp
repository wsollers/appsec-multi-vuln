#include <filesystem>
#include <iostream>
#include <string>
#include <thread>

#include "httplib.h"

static std::filesystem::path root_path() {
    auto path = std::filesystem::current_path();
    while (!std::filesystem::exists(path / "support" / "local.crt")) {
        if (path == path.root_path()) {
            break;
        }
        path = path.parent_path();
    }
    return path;
}

int main() {
    auto root = root_path();
    httplib::Server http;
    httplib::SSLServer https((root / "support" / "local.crt").string().c_str(),
                             (root / "support" / "local.key").string().c_str());

    auto route = [](const httplib::Request& req, httplib::Response& res) {
        auto value = req.get_param_value("next");
        if (value.empty()) {
            value = "/";
        }
        res.set_redirect(value.c_str());
    };

    http.Get("/go", route);
    https.Get("/go", route);

    std::thread a([&] { http.listen("0.0.0.0", 8080); });
    std::thread b([&] { https.listen("0.0.0.0", 8443); });
    std::cout << "case-045\n";
    a.join();
    b.join();
}
