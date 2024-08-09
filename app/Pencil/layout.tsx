export default function SubAppLayout( { children, } : { children: React.ReactNode } ) {
    const sectionStyle = {
        width: "100%",
        height: "100%"
    }
    return <section style={sectionStyle}>{children}</section>
}