import Header from './Header'
import Toolbar from './Toolbar'
import Viewport from './Viewport'
import Footer from './Footer'

function BrowserWindow() {
  return (
    <div className="browser-window">
      <Header />
      <Toolbar />
      <Viewport />
      <Footer />
    </div>
  )
}

export default BrowserWindow
