import re
import os

p = "client/src"
def rep(filepath, pattern, repl):
    with open(filepath, 'r') as f:
        content = f.read()
    content = re.sub(pattern, repl, content)
    with open(filepath, 'w') as f:
        f.write(content)

rep(f"{p}/components/common/RestrictedPage.tsx", r"tilt=\{-3\}", r"rotateDeg={-3}")
rep(f"{p}/components/common/RestrictedPage.tsx", r"animate ", r"animateSlam ")

rep(f"{p}/pages/AuditLogPage.tsx", r"emptyMessage=", r"emptyTitle=")
rep(f"{p}/pages/UsersPage.tsx", r"emptyMessage=", r"emptyTitle=")

rep(f"{p}/pages/UsersPage.tsx", r"isLoading=\{isUpdatingStatus\}", r"")
rep(f"{p}/pages/UsersPage.tsx", r'<Modal\n\s*isOpen=\{isModalOpen\}[\s\S]*?title=".*?Personnel.*?(\n\s*size="sm")?', lambda m: m.group(0).replace('size="sm"', ''))

