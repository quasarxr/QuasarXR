import styles from './styles.module.css';

export default function DashboardLayout( { children, } : { children: React.ReactNode } ) {
    return (
        <section className={styles.container}>
            {children}
        </section>
    )
}