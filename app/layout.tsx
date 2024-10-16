export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    type Property = {
      a: Number,
      b: String
    }
    let a : Property
    console.log( children )

    const htmlStyle = {
      width: "100%",
      height: "100%",
      overflow: "hidden",
      margin: "0px"
    }
    return (
      <html lang="en">
        <title>QuasarXR</title>
        <head><link rel="icon" href="/favicon.ico" sizes="any" /></head>
        <body style={htmlStyle}>{children}</body>
      </html>
    )
  }