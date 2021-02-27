# Encrypted Cookie Store
A partial implementation of the [Cookie Store API](https://wicg.github.io/cookie-store)
that transparently encrypts and decrypts cookies via __AES-GCM__.

This is likely only useful in server-side implementations, 
but written in a platform-agnostic way. 