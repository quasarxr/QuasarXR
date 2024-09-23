export default function ApplicationLayout( { children } : { children : React.ReactNode } ) {
    
    const htmlStyle = {
        width: "100vw",
        height: "100vh",
        margin: "0px",
        overflow: "hidden"
    };
    return (
        <html lang="en">
            <body style={htmlStyle}>
            <main>{children}</main>
            </body>
        </html>
    )
}