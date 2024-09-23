export default function PrivacyLayout( { children, } : { children: React.ReactNode } ) {
    return (
        <section>
            <nav></nav>
            {children}
        </section>
    )
}