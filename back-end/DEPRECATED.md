Deprecated files and cleanup

This project moved the backend into `back-end/app/main.py` (package layout).

Leftover items you may remove locally (but be careful to not remove anything needed by others):

- `back-end/app.py` — legacy entrypoint (may be empty). You can safely delete it.
- `venv/` — if you have a committed virtual environment, remove it locally and ensure `.gitignore` contains `venv/`.

Commands to remove them locally (run from repo root):

```bash
# remove the legacy file
rm -f back-end/app.py

# remove a committed virtualenv directory (if present)
rm -rf venv

# ensure git stops tracking it
git rm -r --cached venv || true
```

If you'd like, I can remove these files for you (I didn't delete them automatically to avoid removing anything you might still be using).