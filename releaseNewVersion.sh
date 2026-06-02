bump() {
  ver=$1
  npm pkg set version=$ver
  git add package.json
  git commit -m "chore: bump version to v$ver"
  git tag v$ver
  git push origin dev --tags
}
