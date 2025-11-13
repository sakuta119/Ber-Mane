const Maintenance = () => (
  <div
    className="min-h-screen flex items-center justify-center px-4 text-center"
    style={{ backgroundColor: 'var(--app-bg)', color: 'var(--text-primary)' }}
  >
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-accent">メンテナンス中・・・</h1>
      <p className="text-sm text-muted">
        現在メンテナンスを実施しております。完了まで今しばらくお待ちください。
      </p>
    </div>
  </div>
)

export default Maintenance


