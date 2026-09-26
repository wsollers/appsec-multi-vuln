using System.Net;
using System.Net.Security;
using System.Net.Sockets;
using System.Security.Authentication;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;

static X509Certificate2 CreateCert()
{
    using var rsa = RSA.Create(1024);
    var request = new CertificateRequest("CN=localhost", rsa, HashAlgorithmName.SHA1, RSASignaturePadding.Pkcs1);
    return request.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddYears(5));
}

static async Task RunHttp()
{
    var listener = new HttpListener();
    listener.Prefixes.Add("http://*:8080/");
    listener.Start();
    while (true)
    {
        var context = await listener.GetContextAsync();
        var target = context.Request.QueryString["next"] ?? "/";
        context.Response.StatusCode = 302;
        context.Response.Headers["Location"] = target;
        var bytes = Encoding.UTF8.GetBytes("case-050");
        await context.Response.OutputStream.WriteAsync(bytes);
        context.Response.Close();
    }
}

static async Task RunHttps(X509Certificate2 cert)
{
    var listener = new TcpListener(IPAddress.Any, 8443);
    listener.Start();
    while (true)
    {
        var client = await listener.AcceptTcpClientAsync();
        _ = Task.Run(async () =>
        {
            using var stream = client.GetStream();
            using var ssl = new SslStream(stream, false);
            await ssl.AuthenticateAsServerAsync(cert, false, SslProtocols.Tls, false);
            var bytes = Encoding.ASCII.GetBytes("HTTP/1.1 302 Found\r\nLocation: /\r\nContent-Length: 8\r\n\r\ncase-050");
            await ssl.WriteAsync(bytes);
        });
    }
}

ServicePointManager.ServerCertificateValidationCallback = (_, _, _, _) => true;
var cert = CreateCert();
_ = RunHttp();
Console.WriteLine("case-050");
await RunHttps(cert);
